import { OpenAPIRoute } from "chanfana";
import type { Env } from "../types";
import { listActiveTokens } from "../kv";

export class TokenList extends OpenAPIRoute {
  static schema = {
    tags: ["OTL Tokens"],
    summary: "列出所有活躍（未使用）令牌",
    responses: {
      "200": { description: "活躍令牌列表" },
    },
  };

  async handle(c: any) {
    const env = c.env as Env;
    const tokens = await listActiveTokens(env.OTL_STORE);

    return c.json({
      success: true,
      tokens: tokens.map((t) => ({
        token: t.token,
        targetUrl: t.targetUrl,
        createdAt: new Date(t.createdAt).toISOString(),
        expirationSeconds: t.expirationTime,
      })),
      count: tokens.length,
    });
  }
}
