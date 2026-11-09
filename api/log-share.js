// Vercel Serverless Function — 記一次分享（邊條片、邊個渠道）。
//   POST /api/log-share   {vkey, title, channel} -> {ok:true}
// channel: wa / fb / wx / copy。跟 bump-play 嗰套：經 SECURITY DEFINER function
// ktalk.log_share_event 寫入，唔使開 UPDATE / INSERT policy。
// 未行 SQL migration 嗰陣 RPC 未有，返 ok:false，前端唔理，分享照行。
const SB_URL = "https://fksifariaiivtxsahaot.supabase.co";
const SB_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrc2lmYXJpYWlpdnR4c2FoYW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MzUzMDEsImV4cCI6MjEwNjExMTMwMX0.oqG3o2q0TsTLj76asJl3-b3tV4v3umrPjiChBah1iNE";

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ ok: false, error: "method not allowed" });
    return;
  }
  let body = req.body || {};
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const vkey = String(body.vkey || "").trim().slice(0, 80);
  const title = String(body.title || "").trim().slice(0, 60);
  const channel = String(body.channel || "").trim().slice(0, 10);
  if (!vkey || !channel) {
    res.status(400).json({ ok: false, error: "missing vkey or channel" });
    return;
  }
  try {
    const r = await fetch(SB_URL + "/rest/v1/rpc/log_share_event", {
      method: "POST",
      headers: {
        apikey: SB_ANON, Authorization: "Bearer " + SB_ANON,
        "Content-Type": "application/json",
        "Accept-Profile": "ktalk", "Content-Profile": "ktalk"
      },
      body: JSON.stringify({ p_vkey: vkey, p_title: title, p_channel: channel })
    });
    if (!r.ok) {
      res.status(503).json({ ok: false, error: "share log not set up yet" });
      return;
    }
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: "share log failed" });
  }
};
