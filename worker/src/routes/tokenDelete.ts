import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { Env } from "../types";
import { deleteTokenRecord } from "../kv";

export const DeleteTokenRequestSchema = z.object({
  token: z.string().describe("要刪除的令牌"),
});

export class TokenDelete extends OpenAPIRoute {
  static schema = {
    tags: ["OTL Tokens"],
    summary: "刪除令牌（管理用途，例如提前作廢）",
    request: {
      body: {
        content: {
          "application/json": {
            schema: DeleteTokenRequestSchema,
          },
        },
      },
    },
    responses: {
      "200": { description: "令牌刪除成功" },
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

    const parsed = DeleteTokenRequestSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "Validation failed" }, 400);
    }

    const { token } = parsed.data;
    await deleteTokenRecord(env.OTL_STORE, token);

    return c.json({ success: true, token });
  }
}
