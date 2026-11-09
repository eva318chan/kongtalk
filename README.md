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
| `assets/fumanting-lamb-pot.jpg` | 分享頁底部廣告圖（測試）：福滿庭羊腩煲海報 |
| `assets/og-composite-huoqubing.jpg` | 合併 preview 圖（1200×1140，上面《霍去病》片圖原比例全幅、下面廣告價錢，242KB） |
| `assets/og-pip-huoqubing.jpg` | 畫中畫 preview 圖 demo（1200×630，片圖全幅，細廣告貼喺右下角，125KB） |
| `assets/og-portrait-huoqubing.jpg` | 直式 preview 圖 demo（720×1233，江仔 send 嚟嘅 sample：上面直式片圖原比例、下面闊版廣告原比例，124KB） |
| `assets/og-square-huoqubing.jpg` | 方形 preview 圖（1200×1200，江仔 sample 嗰個尺寸：上格 title card、下格闊版廣告，兩格原比例，231KB）— 預設合併圖 |
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

## 分享頁廣告（測試，2026-11-10）

- `api/share-card.js` 落地頁最底（「睇埋我其他片」掣之下）有廣告位，現放福滿庭羊腩煲海報（`assets/fumanting-lamb-pot.jpg`，1080×1447）做測試。
- 廣告圖全寬顯示（手機約 444×595px），上附「廣告」字樣。
- WhatsApp 分享（2026-11-10，江仔拍板用 `wa.me` 文字 link，唔再用原生分享附廣告圖）：撳 WhatsApp 分享掣會開 `wa.me/?text=...`，文字入面有條片 link，WhatsApp 會自己生成 preview 卡（方形合併圖＋標題＋簡介），效果同手動 copy link 貼入 WhatsApp 一模一樣，成張卡㩒得入去。注意：WhatsApp link preview 本身唔會喺對話入面直接播片，只顯示縮圖，要播片始終要㩒入去。
- **江仔手機實測（2026-11-10）：之前原生分享（`navigator.share` + 廣告圖 file）廣告大圖出到，但片嘅 link preview 卡唔見咗** — WhatsApp 唔會為圖片 caption 入面條 link 生成 preview。江仔 13:17 再實測對比：撳 WhatsApp 掣（原生分享）淨係出到直式廣告大圖、冇 preview 卡；手動 copy link 貼入 WhatsApp 就出到方形合併圖 preview 卡＋標題＋簡介。所以改返用 `wa.me` 文字 link，等兩個做法結果一致。原生分享嗰套 code（`prefetchAdFile`／`_adFile`）已刪除。
- 合併 preview 圖（2026-11-10）：`assets/og-composite-huoqubing.jpg`（1200×1140，上面片圖、下面廣告價錢，$268／$468 睇到）。分享 link 加 `&og=composite` 用呢張圖。只限呢條片，落地頁本身唔變。**做圖鐵律（江仔兩度糾正）：合併兩張圖嗰陣，片圖一定要保持原比例** — 第一版將片圖壓扁到一半高、將廣告由 497px 高壓扁到 312px，睇落拉闊咗；呢版加高成 1140px，片圖用返原比例全幅（裁走咗縮圖本身上下嘅黑邊，淨返畫面），廣告嗰截用返 2:1 擷圖等比放大，兩樣都冇拉闊冇壓扁。
- 方形 preview 圖（2026-11-10，江仔 send 咗佢嗰張 sample 並排比較，話我之前嗰版仍然唔啱原圖比例）：`assets/og-square-huoqubing.jpg`（1200×1200，231KB）。跟足 sample（image-23，1536×1536）嘅尺寸：成張正方形，上格係《霍去病》title card、下格係闊版廣告，兩格都係原比例，位置同黑邊都跟 sample（上格 y 47-547、下格 y 594-1128）。下格用嘅係江仔 sample（image-24）嗰張闊版廣告：單點 $268、超抵套餐特價 $398。admin 分享呢條片（帶 `&ad=1`）嗰陣，唔使加 `?og=` 參數都會用呢張做 `og:image`，即係而家嘅預設合併圖。只限呢條片。
- 畫中畫 preview 圖 demo（2026-11-10，江仔提出）：`assets/og-pip-huoqubing.jpg`（1200×630，片圖全幅，細廣告貼喺右下角，$268／$468 睇到）。分享 link 加 `&og=pip` 用呢張圖。注意：手機 preview 細嗰陣，右下角細廣告啲字會好細；WhatsApp 細 view 裁剪嗰陣，右下角有機會裁走一部分。只限呢條片，係合併圖嘅另一個版本，唔係預設。
- 直式 preview 圖 demo（2026-11-10，江仔 send sample 嚟話要跟呢個做法）：`assets/og-portrait-huoqubing.jpg`（720×1233，上面直式片圖原比例、下面闊版廣告原比例，兩樣都冇拉闊冇壓扁，淨係等比縮細＋裁走 sample 底部黑邊）。分享 link 加 `&og=portrait` 用呢張圖。注意：江仔話之前合併圖嗰版將原圖拉闊咗（下面廣告嗰截由 497px 高壓扁到 312px）——呢版已修正，片圖同廣告都保持原比例。**價錢出入未核實：呢張 sample 嘅廣告係「超抵套餐」原價 $588 特價 $398（古法羊腩煲大、臘味炒芥蘭、椰香荔芋油鴨脾煲），同分享頁而家用緊嗰張直式海報「豪華套餐」特價 $468（臘味炒芥蘭、清蒸虎彬斑）唔同；邊個先係最新價錢，等江仔確認，分享頁海報暫時未換。**只限呢條片，demo 比較用，未拍板做預設。

## 廣告全開測試中（2026-11-10，江仔話要 &ad=1 全時間有，否則測試唔到）

- 而家全部分享都帶 `&ad=1`：`index.html` 撳分享嗰陣一定加 `&ad=1`；`api/share-card.js` 冇 `&ad=` 參數嗰陣都當有廣告（預設顯示），淨係明確寫 `&ad=0` 先唔顯示。所以舊 link（冇 `&ad=1` 嗰啲）開返都會顯示廣告同方形 preview 圖，唔使重新分享。
- 之前「只限 admin 分享先有廣告」嗰個機制暫停咗：`index.html` 入面 `ADMIN_EMAILS`／`isAdminSharer()` 留返喺度未用，個 list 而家係空嘅；江仔之後話要改返 admin 先有限，先至將分享嗰幾處改返用 `isAdminSharer()` 判斷，同埋將 `share-card.js` 嘅 `showAd` 預設改返 `false`。
- 注意：呢個係產品規則，唔係保安邊界 — 識得手動加 `&ad=0` 嘅人都可以令條 link 唔顯示廣告。

## 分享報告（2026-11-10，江仔拍板：自家追蹤，唔用 Bitly）

- 睇報告唔使登入 Supabase，直接開 `https://ktalk.hk/api/report`：每條片一行 — 播放／分享／分享 link 被㩒／最多人㩒嘅國家；撳入去有詳細（按國家＋近 30 日按日）。
- 播放 = `videos.plays`（`bump-play` 計嘅播放次數）；分享 = 撳分享掣嗰陣經 `api/log-share.js` 記低（由呢個功能上線先開始計，之前嗰 46 次係舊版本地計數，唔係真數）；分享 link 被㩒 = 真人㩒入 `api/share-card` 嗰陣經 `ktalk.log_share_click` 記低，國家／城市由 Vercel geo header 嚟，WhatsApp／Facebook 攞 preview 嗰啲爬蟲唔計。
- 全部係「次數」唔係「幾多個人」，因為觀眾多數冇登入，我哋亦唔存 IP 地址。
- **行 SQL 先有數**：Supabase Dashboard → SQL Editor → 貼上 `supabase/migrations/20261110_share_clicks.sql` 成份 → Run。行之前，報告頁會顯示未設定，分享／點擊唔會入數；行完之後先開始計，之前嘅追唔返。

<!-- rename-verified -->

<!-- deploy-trigger -->
