import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { Env } from "../types";
import { createTokenRecord } from "../kv";
import {
  generateUUID,
  buildEncryptedBundle,
  bufferToBase64,
} from "../crypto";
import { DEFAULT_PUBLIC_KEY_PEM } from "../rsaKey";

export const CreateTokenRequestSchema = z.object({
  token: z.string().optional().describe("自訂令牌（可選，預設自動產生 UUID）"),
  targetUrl: z.string().url().describe("一次性連結最終導向的目標網址"),
  expirationSeconds: z
    .number()
    .int()
    .positive()
    .optional()
    .default(3600)
    .describe("有效期限（秒），預設 3600 秒（1 小時）"),
});

export class TokenCreate extends OpenAPIRoute {
  static schema = {
    tags: ["OTL Tokens"],
    summary: "建立一次性令牌（並以 RSA-4096 加密令牌供展示）",
    request: {
      body: {
        content: {
          "application/json": {
            schema: CreateTokenRequestSchema,
          },
        },
      },
    },
    responses: {
      "201": {
        description: "令牌建立成功",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              token: z.string(),
              targetUrl: z.string(),
              expirationSeconds: z.number(),
              redirectUrl: z.string().describe("提供給使用者點擊的確認頁網址"),
              encryptedTokenBase64: z
                .string()
                .describe("RSA-4096 加密後的令牌（Base64），僅供展示/稽核"),
              saltBase64: z.string().describe("本次使用的鹽（Base64）"),
            }),
          },
        },
      },
      "400": { description: "請求參數錯誤" },
    },
  };

  async handle(c: any) {
    const env = c.env as Env;
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }

    const parsed = CreateTokenRequestSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        { error: "Validation failed", details: parsed.error.format() },
        400
      );
    }

    const { targetUrl, token: customToken, expirationSeconds } = parsed.data;
    const token = customToken || generateUUID();
    const expSeconds = expirationSeconds || 3600;

    const publicKeyPem = env.RSA_PUBLIC_KEY_PEM || DEFAULT_PUBLIC_KEY_PEM;

    let encryptedTokenB64 = "";
    let saltB64 = "";

    try {
      const bundle = await buildEncryptedBundle(targetUrl, token, publicKeyPem);
      encryptedTokenB64 = bufferToBase64(bundle.encryptedToken);
      saltB64 = bufferToBase64(bundle.salt.buffer as ArrayBuffer);
    } catch (e) {
      // RSA 加密失敗不應阻擋 token 建立（僅為展示用途）
      console.error("RSA encrypt failed:", e);
    }

    await createTokenRecord(
      env.OTL_STORE,
      token,
      targetUrl,
      expSeconds,
      encryptedTokenB64,
      saltB64
    );

    const url = new URL(c.req.url);
    const redirectUrl = `${url.origin}/r/${encodeURIComponent(token)}`;

    return c.json(
      {
        success: true,
        token,
        targetUrl,
        expirationSeconds: expSeconds,
        redirectUrl,
        encryptedTokenBase64: encryptedTokenB64,
        saltBase64: saltB64,
      },
      201
    );
  }
}
