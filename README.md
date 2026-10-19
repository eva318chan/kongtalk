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
| `api/share-card.js` | 分享卡片產生 |
| `api/delete-video.js` | 刪除影片（含 Stream 及資料庫清理） |
| `api/delete-account.js` | 刪除帳號 |
| `deploy-test-bella.txt` | Deploy pipeline 測試檔（可安全刪除） |

## 開發流程（已定）

1. 光仔講需求；
2. 直接改 code，commit＋push 上 `main`（唔開 PR、不經 review）；
3. Vercel 自動 deploy；
4. 通知光仔去 https://ktalk.hk 驗收。

## 本地開發

- 前端：直接用瀏覽器開 `index.html` 可睇版面；但 Supabase／Stream／api 功能需要 key 及後端，完整測試請用 `vercel dev` 或 deploy preview。
- `api/*` 係 Node.js serverless functions，改完 push 上 `main` 即生效。

## 維護注意事項

- 改 `api/live.js` 的直播位後 push 即生效，唔使改前端。
- 影片相關操作（上傳／刪除）同時牽涉 Cloudflare Stream 及 Supabase，兩邊要一齊處理，唔好只清一邊。
- 用戶資料刪除（`delete-account.js`）係不可逆操作，執行前請光仔確認。
- 唔好掂 `master` branch。

<!-- rename-verified -->

<!-- deploy-trigger -->
