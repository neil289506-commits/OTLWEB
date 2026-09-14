import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { Env } from "../types";
import { getTokenRecord, markTokenAsUsed, logAccess } from "../kv";

export const UseTokenRequestSchema = z.object({
  token: z.string().describe("要使用（銷毀）的令牌"),
});

/**
 * 使用令牌 = 銷毀令牌 + 回傳目標網址
 *
 * 這支 API 只應該在使用者於確認頁上「主動按下確認」後才被呼叫，
 * 前端 GET /r/:token 只顯示確認頁，並不會呼叫這支 API，
 * 藉此達成「按下去之後才銷毀 token」的需求。
 */
export class TokenUse extends OpenAPIRoute {
  static schema = {
    tags: ["OTL Tokens"],
    summary: "使用令牌（銷毀並取得目標網址）",
    request: {
      body: {
        content: {
          "application/json": {
            schema: UseTokenRequestSchema,
          },
        },
      },
    },
    responses: {
      "200": { description: "令牌使用成功，回傳目標網址" },
      "403": { description: "令牌已被使用過" },
      "404": { description: "令牌不存在或已過期" },
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

    const parsed = UseTokenRequestSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "Validation failed" }, 400);
    }

    const { token } = parsed.data;
    const userAgent = c.req.header("user-agent") || "unknown";
    const ip = c.req.header("cf-connecting-ip") || "unknown";

    const record = await getTokenRecord(env.OTL_STORE, token);

    if (!record) {
      return c.json({ success: false, error: "Token not found or expired" }, 404);
    }

    if (record.used) {
      await logAccess(env.OTL_STORE, token, userAgent, ip, "used_attempt");
      return c.json({ success: false, error: "Token already used" }, 403);
    }

    await markTokenAsUsed(env.OTL_STORE, token);
    await logAccess(env.OTL_STORE, token, userAgent, ip, "confirmed");

    return c.json({
      success: true,
      token,
      targetUrl: record.targetUrl,
    });
  }
}
