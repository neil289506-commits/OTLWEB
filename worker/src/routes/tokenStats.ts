import { OpenAPIRoute } from "chanfana";
import type { Env } from "../types";
import { getTokenStats } from "../kv";

export class TokenStats extends OpenAPIRoute {
  static schema = {
    tags: ["OTL Tokens"],
    summary: "取得令牌統計資訊",
    responses: {
      "200": { description: "令牌統計資訊" },
    },
  };

  async handle(c: any) {
    const env = c.env as Env;
    const stats = await getTokenStats(env.OTL_STORE);

    return c.json({
      ...stats,
      usagePercent:
        stats.total > 0 ? ((stats.used / stats.total) * 100).toFixed(2) : "0",
    });
  }
}
