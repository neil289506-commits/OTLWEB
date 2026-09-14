/**
 * OTL Web System - 前端設定
 *
 * 部署到 GitHub Pages 前，請把下方 WORKER_BASE_URL
 * 改成你自己的 Cloudflare Worker 網址。
 *
 * 例如：https://otl-hono-api.neil289506.workers.dev
 */

export const CONFIG = {
  WORKER_BASE_URL: "https://otl-hono-api.neil289506.workers.dev",

  /** 預設有效期限選項（秒） */
  EXPIRATION_PRESETS: [
    { label: "15 分鐘", seconds: 15 * 60 },
    { label: "1 小時", seconds: 60 * 60 },
    { label: "6 小時", seconds: 6 * 60 * 60 },
    { label: "24 小時", seconds: 24 * 60 * 60 },
    { label: "7 天", seconds: 7 * 24 * 60 * 60 },
  ],

  DEFAULT_EXPIRATION_SECONDS: 60 * 60,
};
