# 講圈 KongTalk（piaoquan-demo）

「講圈」— 香港人講嘢嘅短片平台：手機上滑短片 feed、影片直傳、文章、關注、分享、官方直播及觀眾人數。現已上線營運中。

- 線上網址：https://ktalk.hk / https://kongtalk.com（兩個域名指向同一個 Vercel deployment）

## ⚠️ Branch 注意（重要）

- **`main` = production**：線上 `ktalk.hk` 跑嘅就係呢個 branch。所有改動 push 上 `main` 即自動 deploy。
- **`master`（default branch）= 2026-09-28 的舊 demo**：已廢棄，千祈唔好喺上面改嘢，亦唔好 merge 佢入 `main`。
- 另有 `feat/follow-articles` 功能分支，合併前請先確認。

## 技術棧

- 前端：單檔 vanilla HTML/CSS/JS（`index.html` 約 110 KB），無 framework、無 build step，手機優先
- 後端：Vercel serverless functions（`api/` 目錄）
- 資料庫／認證：Supabase（auth、follows、articles、影片 metadata）
- 影片：Cloudflare Stream（儲存＋播放；直傳經 `api/direct-upload.js` 簽名後由客戶端直傳）
- Hosting：Vercel

## 資料夾／檔案

| 路徑 | 說明 |
|---|---|
| `index.html` | 全部前端：上滑 feed、拍片上傳、文章、關注、個人頁、直播觀看等 |
| `vercel.json` | Vercel 設定（首頁 cache headers 等） |
| `api/live.js` | 官方直播位設定：只有 official account 可開；`slots` 陣列加／減一行即加減直播位（支援 YouTube embed／Cloudflare Stream live） |
| `api/direct-upload.js` | Cloudflare Stream 直傳簽名 |
| `api/bump-play.js` | 播放次數統計 |
| `api/share-card.js` | 分享卡片產生；真人㩒入分享 link 嗰陣記一次 click（國家／城市／裝置，爬蟲唔計） |
| `api/click-stats.js` | 逐條片點擊統計 JSON：`GET /api/click-stats?v=<uid>` |
| `api/log-share.js` | 記一次分享（邊條片、wa／fb／wx 渠道） |
| `api/report.js` | 分享報告頁，唔使登入 Supabase：`https://ktalk.hk/api/report`（總覽）／`?v=<uid>`（詳細：按國家＋近 30 日按日） |
| `supabase/migrations/20261110_share_clicks.sql` | 點擊＋分享追蹤嘅 SQL（表＋function），要喺 Supabase SQL Editor 行一次先有數 |
| `api/delete-video.js` | 刪除影片（含 Stream 及資料庫清理） |
| `api/delete-account.js` | 刪除帳號 |
| `deploy-test-bella.txt` | Deploy pipeline 測試檔（可安全刪除） |

## 開發流程（已定）

1. 江仔講需求；
2. 直接改 code，commit＋push 上 `main`（唔開 PR、不經 review）；
3. Vercel 自動 deploy；
4. 通知江仔去 https://ktalk.hk 驗收。

## 本地開發

- 前端：直接用瀏覽器開 `index.html` 可睇版面；但 Supabase／Stream／api 功能需要 key 及後端，完整測試請用 `vercel dev` 或 deploy preview。
- `api/*` 係 Node.js serverless functions，改完 push 上 `main` 即生效。

## 維護注意事項

- 改 `api/live.js` 的直播位後 push 即生效，唔使改前端。
- 影片相關操作（上傳／刪除）同時牽涉 Cloudflare Stream 及 Supabase，兩邊要一齊處理，唔好只清一邊。
- 用戶資料刪除（`delete-account.js`）係不可逆操作，執行前請江仔確認。
- 唔好掂 `master` branch。

## 上滑 Feed 體驗（2026-11-11）

- **全屏 Scroll Snap 卡片流**：`#feed` 高度 `100dvh`，每條片 `height: 100dvh`＋`scroll-snap-align: start`，上推／下拉自動磁吸對齊，唔會停喺半空。首頁時頂部白 bar 隱藏、底部 tab bar 浮喺片上面（TikTok 式），控制列／標題／右側掣全部移高，唔會被 tab bar 遮住。
- **智能預載＋清理**：睇緊第 N 條嗰陣，背景靜默預載第 N+1 條（mp4 預載頭段＋`preload="auto"`；Stream／YouTube 預載封面圖）。碌走超過一格之後，遠處卡嘅播放器／`<video>` 元素會被拆走，只留封面圖，慳記憶體；碌返去嗰陣自動還原再播。
- **右側懸浮操作列**：每條片右側垂直三個掣 — 作者頭像＋「+」關注、❤️ 讚（撳落去放大變紅＋彈性動畫＋愛心飛出，狀態記 `localStorage`）、📤 分享（沿用現有 `wa.me` 文字分享＋`api/log-share.js` 追蹤，冇改過）。讚數係示範基數（由播放數推算）＋自己嗰下；關注只記本地，唔會寫入 Supabase。留言掣刻意唔加（要後端，遲啲再做）。
- **開聲解鎖**：第一條片預設靜音播，畫面頂部有「🔊 點擊開啟聲音」脈動提示；撳一次之後全站有聲，之後所有片自動有聲播。片身／控制列嘅音量掣一樣可以解鎖。

## WhatsApp 分享

- 撳 WhatsApp 分享掣會開 `wa.me/?text=...`，文字入面有條片 link，WhatsApp 會自己生成 preview 卡（片圖＋標題＋簡介），效果同手動 copy link 貼入 WhatsApp 一模一樣，成張卡㩒得入去。注意：WhatsApp link preview 本身唔會喺對話入面直接播片，只顯示縮圖，要播片始終要㩒入去。
- 2026-11-10 曾經試過喺分享加廣告（分享頁底部福滿庭海報、合併 preview 圖、`&ad=1` 全開），江仔同日話全部移除 — 廣告 code 同圖檔已刪，完整紀錄喺 git commit history 入面搵得返。

## 分享報告（2026-11-10，江仔拍板：自家追蹤，唔用 Bitly）

- 睇報告唔使登入 Supabase，直接開 `https://ktalk.hk/api/report`：每條片一行 — 播放／分享／分享 link 被㩒／最多人㩒嘅國家；撳入去有詳細（按國家＋近 30 日按日）。
- 播放 = `videos.plays`（`bump-play` 計嘅播放次數）；分享 = 撳分享掣嗰陣經 `api/log-share.js` 記低（由呢個功能上線先開始計，之前嗰 46 次係舊版本地計數，唔係真數）；分享 link 被㩒 = 真人㩒入 `api/share-card` 嗰陣經 `ktalk.log_share_click` 記低，國家／城市由 Vercel geo header 嚟，WhatsApp／Facebook 攞 preview 嗰啲爬蟲唔計。
- 全部係「次數」唔係「幾多個人」，因為觀眾多數冇登入，我哋亦唔存 IP 地址。
- **行 SQL 先有數**：Supabase Dashboard → SQL Editor → 貼上 `supabase/migrations/20261110_share_clicks.sql` 成份 → Run。行之前，報告頁會顯示未設定，分享／點擊唔會入數；行完之後先開始計，之前嘅追唔返。

<!-- rename-verified -->

<!-- deploy-trigger -->
