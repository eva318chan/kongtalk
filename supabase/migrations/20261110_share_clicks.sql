-- 講圈分享 link 點擊追蹤（自家追蹤，唔用 Bitly）— 2026-11-10
--
-- 點行：Supabase Dashboard → SQL Editor → 貼上成份 → Run，一次就得。
-- 跟 bump_play 嗰套做法：寫入經 SECURITY DEFINER function，唔開 table 直寫 policy。
-- 私隱：唔存 IP 地址，只存國家／地區／城市（Vercel geo header 俾嘅）＋裝置＋referrer。
-- 爬蟲（WhatsApp / Facebook 攞 preview 嗰啲）由 api/share-card.js 嗰邊過濾，唔會入表。
--
-- 1. 點擊記錄表
create table if not exists ktalk.share_clicks (
  id bigint generated always as identity primary key,
  vkey text not null,            -- share-card ?v= 嗰個 key（32 位 stream uid / d1–d7 / live0）；舊式 ?t= link 會記做 "t:<標題>"
  title text,                    -- 當時嘅片名（方便人眼對數）
  country text,                  -- 兩位國家碼，例如 HK / CN / US（Vercel x-vercel-ip-country）
  region text,                   -- 地區碼，例如 HK
  city text,                     -- 城市，例如 Hong Kong
  device text,                   -- mobile / tablet / desktop（由 user-agent 估）
  referrer text,                 -- 邊度嚟（多數係空，因為 WhatsApp 直接開 link）
  user_agent text,               -- 完整 user-agent（方便之後分裝置／捉漏網爬蟲）
  clicked_at timestamptz not null default now()
);
create index if not exists share_clicks_vkey_time_idx on ktalk.share_clicks (vkey, clicked_at desc);
create index if not exists share_clicks_country_idx on ktalk.share_clicks (country);

-- 直接讀寫表唔開放：只可以經下面兩個 function（同 bump_play 一樣）
revoke all on ktalk.share_clicks from anon, authenticated;

-- 2. 記一次 click（api/share-card.js 真人㩒入嗰陣 call）
create or replace function ktalk.log_share_click(
  p_vkey text, p_title text, p_country text, p_region text,
  p_city text, p_device text, p_referrer text, p_user_agent text
) returns void
language plpgsql security definer
as $$
begin
  insert into ktalk.share_clicks
    (vkey, title, country, region, city, device, referrer, user_agent)
  values
    (p_vkey, p_title, p_country, p_region, p_city, p_device, p_referrer, p_user_agent);
end;
$$;
grant execute on function ktalk.log_share_click(text, text, text, text, text, text, text, text) to anon, authenticated;

-- 3. 讀統計：總 clicks＋按國家＋近 30 日按日（api/click-stats.js call）
create or replace function ktalk.share_click_stats(p_vkey text)
returns jsonb
language sql security definer
as $$
  select jsonb_build_object(
    'vkey', p_vkey,
    'total', (select count(*) from ktalk.share_clicks where vkey = p_vkey),
    'by_country', coalesce((
      select jsonb_agg(jsonb_build_object('country', country, 'clicks', clicks) order by clicks desc)
      from (select country, count(*) as clicks from ktalk.share_clicks where vkey = p_vkey group by country) s
    ), '[]'::jsonb),
    'by_day', coalesce((
      select jsonb_agg(jsonb_build_object('day', day, 'clicks', clicks) order by day desc)
      from (
        select to_char(clicked_at at time zone 'Asia/Hong_Kong', 'YYYY-MM-DD') as day, count(*) as clicks
        from ktalk.share_clicks
        where vkey = p_vkey and clicked_at >= now() - interval '30 days'
        group by day
      ) s
    ), '[]'::jsonb)
  );
$$;
grant execute on function ktalk.share_click_stats(text) to anon, authenticated;

-- 用開 ktalk schema 嗰個 profile 先 call 到 RPC（bump_play 都係咁）
grant usage on schema ktalk to anon, authenticated;

-- 4. 分享記錄表（之前分享數只係前端本地計數，唔會入 DB；由呢刻起真係記低）
--    前端撳 WhatsApp / Facebook / 微信分享嗰陣，經 api/log-share.js call 下面個 function。
create table if not exists ktalk.share_events (
  id bigint generated always as identity primary key,
  vkey text not null,
  title text,
  channel text,                  -- wa / fb / wx / copy
  shared_at timestamptz not null default now()
);
create index if not exists share_events_vkey_time_idx on ktalk.share_events (vkey, shared_at desc);
revoke all on ktalk.share_events from anon, authenticated;

create or replace function ktalk.log_share_event(
  p_vkey text, p_title text, p_channel text
) returns void
language plpgsql security definer
as $$
begin
  insert into ktalk.share_events (vkey, title, channel)
  values (p_vkey, p_title, p_channel);
end;
$$;
grant execute on function ktalk.log_share_event(text, text, text) to anon, authenticated;

-- 5. 報告總覽：每條片一行 — 播放（videos.plays）＋分享（share_events）＋分享 link 被㩒（share_clicks）＋最多人㩒嘅國家
--    api/report.js call 呢個，一次攞晒成個報告，唔使逐條片 call 幾十次。
create or replace function ktalk.report_overview()
returns jsonb
language sql security definer
as $$
  select coalesce(jsonb_agg(x order by x.created_at desc), '[]'::jsonb)
  from (
    select
      v.stream_uid as vkey,
      v.title as title,
      coalesce(v.plays, 0) as plays,
      coalesce((select count(*) from ktalk.share_events s where s.vkey = v.stream_uid), 0) as shares,
      coalesce((select count(*) from ktalk.share_clicks c where c.vkey = v.stream_uid), 0) as clicks,
      (select c.country from ktalk.share_clicks c
        where c.vkey = v.stream_uid and c.country is not null and c.country <> ''
        group by c.country order by count(*) desc limit 1) as top_country,
      v.created_at as created_at
    from ktalk.videos v
    order by v.created_at desc
    limit 40
  ) x;
$$;
grant execute on function ktalk.report_overview() to anon, authenticated;

-- 驗證（Run 完可以喺 SQL Editor 逐行試）：
-- select ktalk.share_click_stats('4d1498ccd02998f0b85d03e5443d966c');
-- select ktalk.report_overview();
-- select count(*) as total, country, count(*) from ktalk.share_clicks group by country order by total desc;
