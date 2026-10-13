/* 官方直播位（平台專用）
 * 只有 official account 可以開直播位：設定全部喺呢個檔案，改完 push＋deploy 即生效。
 * 一般用戶嘅上傳流程（publishVideo）永遠唔會產生 kind=yt / kind=cflive，所以鎖死咗普通用戶開唔到。
 *
 * kind 說明：
 * - "yt"：YouTube 影片／直播。填 ytId（YouTube 網址 v= 後面嗰串碼）。直播都係同一個 embed 法，開播自動變直播畫面。
 * - "cflive"：Cloudflare Stream 直播。喺 Cloudflare 後台 Stream → Live inputs 開一個 live input，
 *   將佢嘅 UID 填入 liveUid；推流用 OBS → 拎 RTMP 地址＋stream key（後台 copy）。
 *
 * 想加／減直播位：喺下面 slots 陣列加／刪一行，push 上 GitHub，等 Eddie「可以上線」後 deploy。
 */
module.exports = async (req, res) => {
  res.status(200).json({
    ok: true,
    slots: [
      { kind: "yt", ytId: "Eye2fQ3wqH8", t: "講圈官方直播", a: "講圈官方" },
      /* 範例（未啟用；啟用時刪走 // 並填真 ID）：
      { kind: "cflive", liveUid: "PASTE_LIVE_INPUT_UID", t: "講圈官方直播", a: "講圈官方" },
      */
    ]
  });
};
