/**
 * OTL Web System - Cloudflare Worker 主入口
 *
 * 架構：Hono + Chanfana（OpenAPI）+ KV
 *
 * 端點總覽：
 *   GET  /health                    健康檢查
 *   GET  /docs                      OpenAPI 文件
 *   POST /api/tokens/create         建立一次性令牌（含 RSA 加密展示）
 *   POST /api/tokens/verify         驗證令牌（不銷毀）
 *   POST /api/tokens/use            使用令牌（銷毀 + 回傳目標網址）※ 確認頁按鈕呼叫
 *   GET  /api/tokens/list           列出所有活躍令牌
 *   POST /api/tokens/delete         刪除令牌
 *   GET  /api/tokens/stats          統計資訊
 *   GET  /r/:token                  美觀的確認跳轉頁（不會自動銷毀 token）
 */

import { Hono } from "hono";
import { fromHono } from "chanfana";
import type { Env } from "./types";
import { getTokenRecord } from "./kv";
import { renderConfirmPage, renderErrorPage } from "./pages";

import { TokenCreate } from "./routes/tokenCreate";
import { TokenVerify } from "./routes/tokenVerify";
import { TokenUse } from "./routes/tokenUse";
import { TokenList } from "./routes/tokenList";
import { TokenDelete } from "./routes/tokenDelete";
import { TokenStats } from "./routes/tokenStats";

const app = new Hono<{ Bindings: Env }>();

// ----------------------------------------------------------------------------
// CORS：允許 GitHub Pages 前端跨網域呼叫
// ----------------------------------------------------------------------------
app.use("*", async (c, next) => {
  await next();
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type");
});

app.options("*", (c) => c.body(null, 204));

// ----------------------------------------------------------------------------
// 健康檢查
// ----------------------------------------------------------------------------
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ----------------------------------------------------------------------------
// 確認跳轉頁（核心新功能）
//
// 使用者點擊一次性連結 → 進入這個頁面 → 看到目標網址 + 「確認並前往」按鈕
// → 按下按鈕後，前端 JS 才呼叫 POST /api/tokens/use 銷毀 token 並取得真正網址
// → 銷毀成功後才用 JS 導向目標網址
//
// 這支 route 本身「只查詢、不銷毀」，確保重新整理頁面不會誤刪 token。
// ----------------------------------------------------------------------------
app.get("/r/:token", async (c) => {
  const env = c.env as Env;
  const token = c.req.param("token");

  if (!token) {
    return c.html(renderErrorPage({ reason: "invalid" }), 400);
  }

  const record = await getTokenRecord(env.OTL_STORE, token);

  if (!record) {
    return c.html(renderErrorPage({ reason: "not_found" }), 404);
  }

  if (record.used) {
    return c.html(renderErrorPage({ reason: "used" }), 410);
  }

  // 雙重確認：即使 KV TTL 尚未觸發，也依邏輯時間判斷是否過期
  const expiresAtMs = record.createdAt + record.expirationTime * 1000;
  if (Date.now() > expiresAtMs) {
    return c.html(renderErrorPage({ reason: "expired" }), 410);
  }

  const url = new URL(c.req.url);
  const useEndpoint = `${url.origin}/api/tokens/use`;

  const html = renderConfirmPage({
    token: record.token,
    targetUrl: record.targetUrl,
    createdAt: record.createdAt,
    expirationTime: record.expirationTime,
    useEndpoint,
  });

  return c.html(html);
});

// ----------------------------------------------------------------------------
// OpenAPI 路由（Chanfana）
// ----------------------------------------------------------------------------
const openapi = fromHono(app, {
  docs_url: "/docs",
});

openapi.post("/api/tokens/create", TokenCreate);
openapi.post("/api/tokens/verify", TokenVerify);
openapi.post("/api/tokens/use", TokenUse);
openapi.get("/api/tokens/list", TokenList);
openapi.post("/api/tokens/delete", TokenDelete);
openapi.get("/api/tokens/stats", TokenStats);

export default app;
