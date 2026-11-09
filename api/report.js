// Vercel Serverless Function — 講圈分享報告，唔使登入 Supabase，直接開 link 睇。
//   https://ktalk.hk/api/report            總覽：每條片 播放 / 分享 / 分享 link 被㩒 / 最多人㩒嘅國家
//   https://ktalk.hk/api/report?v=<uid>  詳細：嗰條片按國家＋近 30 日按日
// 數據嚟自 Supabase（ktalk.report_overview / ktalk.share_click_stats），
// 見 supabase/migrations/20261110_share_clicks.sql。未行嗰份 SQL 嗰陣，
// 呢頁會話你知要行咗先，唔會扮有數。
// 誠實講明：播放／分享／點擊全部係「次數」，唔係「幾多個人」，因為觀眾多數冇登入，
// 我哋亦唔存 IP，認唔到係咪同一個人㩒兩次。分享數由呢個功能上線嗰刻先開始計，之前嗰 46 次係舊版本地計數，唔係真數。
const SB_URL = "https://fksifariaiivtxsahaot.supabase.co";
const SB_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrc2lmYXJpYWlpdnR4c2FoYW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MzUzMDEsImV4cCI6MjEwNjExMTMwMX0.oqG3o2q0TsTLj76asJl3-b3tV4v3umrPjiChBah1iNE";

function esc(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
async function rpc(name, body) {
  var r = await fetch(SB_URL + "/rest/v1/rpc/" + name, {
    method: "POST",
    headers: {
      apikey: SB_ANON, Authorization: "Bearer " + SB_ANON,
      "Content-Type": "application/json",
      "Accept-Profile": "ktalk", "Content-Profile": "ktalk"
    },
    body: JSON.stringify(body || {})
  });
  if (!r.ok) return null;
  var d = await r.json();
  if (typeof d === "string") { try { d = JSON.parse(d); } catch (e) { d = null; } }
  return d;
}
function page(title, inner) {
  return '<!DOCTYPE html><html lang="zh-Hant"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    "<title>" + esc(title) + " · 講圈報告</title></head>" +
    '<body style="margin:0;font-family:-apple-system,\'PingFang HK\',\'Microsoft JhengHei\',sans-serif;background:#f5f5f5;color:#222">' +
    '<div style="max-width:720px;margin:0 auto;background:#fff;min-height:100vh;padding:18px">' +
    '<div style="font-weight:800;font-size:20px">講圈 <span style="font-weight:400;font-size:13px;color:#888">分享報告</span></div>' +
    inner +
    '<p style="color:#999;font-size:12px;margin-top:24px;border-top:1px solid #eee;padding-top:12px">播放／分享／點擊全部係「次數」，唔係「幾多個人」。分享數由呢個功能上線嗰刻先開始計。點擊只計真人㩒入分享 link，WhatsApp／Facebook 攞 preview 嗰啲爬蟲唔計；唔存 IP 地址。</p>' +
    "</div></body></html>";
}
function setupPage() {
  return page("未設定", '<p style="margin-top:16px">報告未設定好。</p>' +
    '<p>請喺 Supabase Dashboard → SQL Editor 貼上並 Run 一次呢份 SQL，之後再開呢頁：</p>' +
    '<p><code>supabase/migrations/20261110_share_clicks.sql</code>（喺 GitHub repo eva318chan/kongtalk 入面）</p>' +
    '<p>Run 完之後，之後有人㩒分享 link、撳分享掣，先會開始有數。之前嘅點擊／分享追唔返。</p>');
}

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  var q = req.query || {};
  var vkey = String(q.v || "").trim().slice(0, 80);
  try {
    if (vkey) {
      var stats = await rpc("share_click_stats", { p_vkey: vkey });
      var over = await rpc("report_overview", {});
      if (!stats || !over) { res.status(200).send(setupPage()); return; }
      var row = (over || []).filter(function (x) { return x.vkey === vkey; })[0] || null;
      var title = row ? row.title : vkey;
      var rows = function (list, k1, k2) {
        return (list || []).map(function (x) {
          return "<tr><td>" + esc(x[k1] || "—") + "</td><td style='text-align:right'>" + esc(x[k2]) + "</td></tr>";
        }).join("") || "<tr><td colspan='2' style='color:#999'>未有數據</td></tr>";
      };
      res.status(200).send(page(title,
        '<p style="margin-top:12px"><a href="/api/report">← 返總覽</a></p>' +
        "<h2 style='font-size:17px'>" + esc(title) + "</h2>" +
        "<p>播放：" + esc(row ? row.plays : 0) + "　分享：" + esc(row ? row.shares : 0) +
        "　分享 link 被㩒：" + esc(stats.total || 0) + "</p>" +
        "<p><a href='/api/share-card?v=" + esc(vkey) + "&others=1'>開呢條片嘅分享頁</a> · " +
        "<a href='/api/click-stats?v=" + esc(vkey) + "'>JSON 數據</a></p>" +
        "<h3 style='font-size:15px'>按國家</h3>" +
        "<table style='width:100%;border-collapse:collapse'><tr><th style='text-align:left'>國家</th><th style='text-align:right'>點擊</th></tr>" +
        rows(stats.by_country, "country", "clicks") + "</table>" +
        "<h3 style='font-size:15px;margin-top:20px'>近 30 日按日</h3>" +
        "<table style='width:100%;border-collapse:collapse'><tr><th style='text-align:left'>日期</th><th style='text-align:right'>點擊</th></tr>" +
        rows(stats.by_day, "day", "clicks") + "</table>"
      ));
      return;
    }
    var overview = await rpc("report_overview", {});
    if (!overview) { res.status(200).send(setupPage()); return; }
    var tp = 0, ts = 0, tc = 0;
    overview.forEach(function (x) { tp += Number(x.plays || 0); ts += Number(x.shares || 0); tc += Number(x.clicks || 0); });
    var trs = overview.map(function (x) {
      return "<tr><td><a href='/api/report?v=" + esc(x.vkey) + "'>" + esc(x.title || x.vkey) + "</a></td>" +
        "<td style='text-align:right'>" + esc(x.plays) + "</td>" +
        "<td style='text-align:right'>" + esc(x.shares) + "</td>" +
        "<td style='text-align:right'>" + esc(x.clicks) + "</td>" +
        "<td style='text-align:right'>" + esc(x.top_country || "—") + "</td></tr>";
    }).join("") || "<tr><td colspan='5' style='color:#999'>未有影片數據</td></tr>";
    res.status(200).send(page("總覽",
      "<p style='margin-top:12px'>總播放：" + tp + "　總分享：" + ts + "　分享 link 總點擊：" + tc + "</p>" +
      "<table style='width:100%;border-collapse:collapse;font-size:14px'>" +
      "<tr><th style='text-align:left'>影片（撳入去睇詳細）</th><th style='text-align:right'>播放</th><th style='text-align:right'>分享</th><th style='text-align:right'>link 被㩒</th><th style='text-align:right'>最多國家</th></tr>" +
      trs + "</table>" +
      "<p style='color:#888;font-size:13px'>只列最近 40 條已上傳嘅片。分享數由呢個功能上線嗰刻先開始計。</p>"
    ));
  } catch (e) {
    res.status(200).send(setupPage());
  }
};
