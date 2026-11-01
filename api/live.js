/* 官方直播位（平台專用）
 * 【2026-11-01 暫停】江仔指示：先關掉直播，集中修好正常分享，之後再處理直播。
 * 重開時將 slots 改返做 [{ kind: "yt", ytId: "...", t: "...", a: "..." }]。
 */
module.exports = async (req, res) => {
  res.status(200).json({ ok: true, slots: [] });
};
