// Vercel Serverless Function — 逐條片嘅分享 link 點擊統計（JSON）。
//   GET /api/click-stats?v=<stream_uid|dN> -> {ok:true, vkey, total, by_country:[{country,clicks}], by_day:[{day,clicks}]}
// 讀 ktalk.share_click_stats RPC（見 supabase/migrations/20261110_share_clicks.sql）。
// 未行 SQL migration 嗰陣 RPC 未有，返 ok:false + 提示，唔會爆 500。
const SB_URL = "https://fksifariaiivtxsahaot.supabase.co";
const SB_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrc2lmYXJpYWlpdnR4c2FoYW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MzUzMDEsImV4cCI6MjEwNjExMTMwMX0.oqG3o2q0TsTLj76asJl3-b3tV4v3umrPjiChBah1iNE";

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  var vkey = String((req.query || {}).v || "").trim().slice(0, 80);
  if (!vkey) { res.status(400).json({ ok: false, error: "missing v" }); return; }
  try {
    var r = await fetch(SB_URL + "/rest/v1/rpc/share_click_stats", {
      method: "POST",
      headers: {
        apikey: SB_ANON, Authorization: "Bearer " + SB_ANON,
        "Content-Type": "application/json",
        "Accept-Profile": "ktalk", "Content-Profile": "ktalk"
      },
      body: JSON.stringify({ p_vkey: vkey })
    });
    if (!r.ok) {
      res.status(503).json({ ok: false, error: "click stats not set up yet - run supabase/migrations/20261110_share_clicks.sql in the Supabase SQL Editor first" });
      return;
    }
    var data = await r.json();
    if (typeof data === "string") { try { data = JSON.parse(data); } catch (e) { data = {}; } }
    data = data || {};
    res.status(200).json({
      ok: true,
      vkey: vkey,
      total: data.total || 0,
      by_country: data.by_country || [],
      by_day: data.by_day || []
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: "stats failed" });
  }
};
