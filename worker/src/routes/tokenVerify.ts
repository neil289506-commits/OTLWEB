import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { Env } from "../types";
import { getTokenRecord } from "../kv";

export const VerifyTokenRequestSchema = z.object({
  token: z.string().describe("要驗證的令牌"),
});

export class TokenVerify extends OpenAPIRoute {
  static schema = {
    tags: ["OTL Tokens"],
    summary: "驗證令牌是否有效（不會銷毀令牌）",
    request: {
      body: {
        content: {
          "application/json": {
            schema: VerifyTokenRequestSchema,
          },
        },
      },
    },
    responses: {
      "200": { description: "令牌驗證結果" },
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

    const parsed = VerifyTokenRequestSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "Validation failed" }, 400);
    }

    const { token } = parsed.data;
    const record = await getTokenRecord(env.OTL_STORE, token);

    if (!record) {
      return c.json(
        { token, isValid: false, used: false, error: "Token not found or expired" },
        404
      );
    }

    return c.json({
      token,
      isValid: !record.used,
      used: record.used,
      targetUrl: record.targetUrl,
      createdAt: new Date(record.createdAt).toISOString(),
      usedAt: record.usedAt ? new Date(record.usedAt).toISOString() : undefined,
    });
  }
}
