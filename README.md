# OTL Web — 一次性連結系統（GitHub Pages + Cloudflare Workers）

這是 [OneTimeLink](原 Qt 桌面版) 的網頁化版本。核心概念不變：
產生一個「只能被開啟並確認一次」的連結，過期或使用後自動失效。

```
┌─────────────────────────┐        ┌──────────────────────────────┐
│  GitHub Pages（前端）    │──────▶│  Cloudflare Workers（後端）    │
│  純靜態 TS + HTML/CSS    │  HTTPS │  Hono + Chanfana + KV         │
│  輸入網址、顯示結果       │◀──────│  RSA-4096 加密、儲存、驗證      │
└─────────────────────────┘        └──────────────────────────────┘
         ▲                                      ▲
         │ 部署                                  │ 部署
         └──────────── GitHub Actions ───────────┘
```

## 目錄結構

```
otl-web/
├── frontend/              GitHub Pages 前端（Vite + TypeScript）
│   ├── src/
│   │   ├── main.ts        主邏輯（表單處理、顯示結果）
│   │   ├── api.ts         呼叫 Worker API 的客戶端
│   │   ├── config.ts       設定檔（Worker 網址、有效期限選項）
│   │   └── style.css      樣式（與確認頁一致的卡片式風格）
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
├── worker/                 Cloudflare Worker 後端
│   ├── src/
│   │   ├── index.ts        主入口（路由設定）
│   │   ├── crypto.ts        RSA-4096 / SHA-512 加密邏輯
│   │   ├── kv.ts            KV 資料存取層
│   │   ├── pages.ts         確認跳轉頁 / 錯誤頁 HTML（美觀樣式）
│   │   ├── rsaKey.ts         內建 RSA 公鑰
│   │   ├── types.ts
│   │   └── routes/           各 API 端點（create / verify / use / list / delete / stats）
│   ├── wrangler.toml
│   └── package.json
│
└── .github/workflows/
    ├── deploy-frontend.yml   自動部署前端到 GitHub Pages
    └── deploy-worker.yml     自動部署後端到 Cloudflare Workers
```

## 核心功能與流程

1. 使用者在前端頁面輸入目標網址、選擇有效期限，按下「產生一次性連結」
2. 前端呼叫 `POST /api/tokens/create`，Worker 端：
   - 產生 UUID 令牌
   - 用 **RSA-4096-OAEP** 加密令牌（供展示 / 保留原設計的加密格式）
   - 把「明文令牌 + 目標網址 + 到期時間」存進 **Cloudflare KV**（會自動過期）
   - 回傳一次性連結：`https://your-worker.workers.dev/r/<token>`
3. 使用者把連結分享出去。對方點擊連結後：
   - 進入 **確認頁**（`GET /r/:token`），看到目標網址、建立/失效時間
   - **此時令牌尚未被銷毀**，重新整理頁面也沒關係
   - 按下「確認並前往」按鈕後，前端 JS 才呼叫 `POST /api/tokens/use`
   - Worker 驗證令牌有效 → 標記為已使用（銷毀）→ 回傳目標網址
   - 前端收到目標網址後才真正跳轉過去
4. 若令牌不存在 / 已使用 / 已過期，顯示對應的美觀錯誤頁

這樣就達成「按下去之後才銷毀 token」的需求，且介面不再是陽春的 `{"Token Used"}` JSON。

## 快速開始

### 1. 部署 Worker（後端）

```bash
cd worker
npm install

# 如果還沒建立 KV Namespace：
npx wrangler kv:namespace create "OTL_STORE"
# 複製輸出的 id，貼到 wrangler.toml 的 kv_namespaces 區塊

# 本機測試
npm run dev

# 部署到 Cloudflare
npm run deploy
```

部署完成後，你會得到一個網址，例如：
`https://otl-hono-api.your-subdomain.workers.dev`

### 2. 設定前端指向你的 Worker

編輯 `frontend/src/config.ts`：

```typescript
export const CONFIG = {
  WORKER_BASE_URL: "https://otl-hono-api.your-subdomain.workers.dev",
  // ...
};
```

### 3. 本機測試前端

```bash
cd frontend
npm install
npm run dev
```

瀏覽器開啟 `http://localhost:5173`

### 4. 部署前端到 GitHub Pages

**方式 A：透過 GitHub Actions 自動部署（推薦）**

1. 把整個專案 push 到你的 GitHub repo
2. Repo → Settings → Pages → Source 選擇 **GitHub Actions**
3. push 到 `main` 分支且 `frontend/` 有變更時會自動觸發部署
4. 也可以到 Actions 頁面手動點 **Run workflow**

**方式 B：手動 build 後上傳**

```bash
cd frontend
npm run build
# dist/ 資料夾就是完整的靜態網站，可上傳到任何靜態主機
```

### 5.（選用）設定 Worker 自動部署

若也想讓 GitHub Actions 自動部署 Worker：

1. 取得 Cloudflare API Token：
   前往 https://dash.cloudflare.com/profile/api-tokens
   建議使用「Edit Cloudflare Workers」範本建立
2. 取得 Account ID：Cloudflare Dashboard 右側欄位可見
3. 到 GitHub repo → Settings → Secrets and variables → Actions，新增：
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
4. 之後 push 到 `main` 且 `worker/` 有變更，就會自動 `wrangler deploy`

## API 一覽

| 方法 | 路徑 | 說明 |
|---|---|---|
| POST | `/api/tokens/create` | 建立一次性令牌 |
| POST | `/api/tokens/verify` | 驗證令牌（不銷毀） |
| POST | `/api/tokens/use` | 使用令牌（銷毀＋取得目標網址）※ 由確認頁呼叫 |
| GET | `/api/tokens/list` | 列出所有活躍令牌 |
| POST | `/api/tokens/delete` | 手動刪除令牌 |
| GET | `/api/tokens/stats` | 統計資訊 |
| GET | `/r/:token` | **確認跳轉頁**（HTML，非 JSON） |
| GET | `/health` | 健康檢查 |
| GET | `/docs` | OpenAPI 文件 |

### 建立令牌範例

```bash
curl -X POST https://your-worker.workers.dev/api/tokens/create \
  -H "Content-Type: application/json" \
  -d '{
    "targetUrl": "https://example.com/secret",
    "expirationSeconds": 3600
  }'
```

回應：

```json
{
  "success": true,
  "token": "550e8400-e29b-41d4-a716-446655440000",
  "targetUrl": "https://example.com/secret",
  "expirationSeconds": 3600,
  "redirectUrl": "https://your-worker.workers.dev/r/550e8400-e29b-41d4-a716-446655440000",
  "encryptedTokenBase64": "b3rm3RgPWUwQFxiQsn...",
  "saltBase64": "kP3m9fQ..."
}
```

## 關於 RSA 加密的設計說明

- Worker 內建一組 RSA-4096 公鑰（`worker/src/rsaKey.ts`），對應原 Qt 版 `RSA/public.pem`
- 建立令牌時，Worker 會用這把公鑰加密令牌明文，結果透過 API 回傳（`encryptedTokenBase64`）
  供前端展示 / 稽核使用
- **KV 資料庫實際儲存的是明文令牌**，這與原 Qt 桌面版設計一致 —— RSA 加密是保護「令牌在傳輸／展示時的格式」，
  並不是後端驗證的必要條件，因此不需要在任何地方保存或使用私鑰
- 如果想更換公鑰，建議用 `wrangler secret put RSA_PUBLIC_KEY_PEM` 設定環境變數覆蓋，
  不要直接把公鑰明文寫進程式碼並 commit（雖然公鑰本身外流沒有資安疑慮，但保持乾淨的秘密管理習慣是好的）

## 授權

MIT
