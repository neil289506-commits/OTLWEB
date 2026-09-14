/**
 * OTL Web System - 前端 API 客戶端
 *
 * 負責與 Cloudflare Worker 後端溝通。
 * RSA 加密在 Worker 端完成（詳見架構說明），前端只需呼叫 REST API。
 */

export interface CreateTokenResponse {
  success: boolean;
  token: string;
  targetUrl: string;
  expirationSeconds: number;
  redirectUrl: string;
  encryptedTokenBase64: string;
  saltBase64: string;
}

export interface ApiErrorResponse {
  error: string;
  details?: unknown;
}

export interface TokenStatsResponse {
  total: number;
  active: number;
  used: number;
  usagePercent: string;
}

export class OtlApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "OtlApiError";
  }
}

export class OtlApiClient {
  constructor(private readonly baseUrl: string) {
    // 去除結尾斜線，避免組合出 //api 這種路徑
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  async createToken(
    targetUrl: string,
    expirationSeconds: number
  ): Promise<CreateTokenResponse> {
    const res = await fetch(`${this.baseUrl}/api/tokens/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUrl, expirationSeconds }),
    });

    const data = await res.json();

    if (!res.ok) {
      const err = data as ApiErrorResponse;
      throw new OtlApiError(err.error || "建立連結失敗", res.status);
    }

    return data as CreateTokenResponse;
  }

  async getStats(): Promise<TokenStatsResponse> {
    const res = await fetch(`${this.baseUrl}/api/tokens/stats`);
    if (!res.ok) {
      throw new OtlApiError("無法取得統計資訊", res.status);
    }
    return (await res.json()) as TokenStatsResponse;
  }

  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/health`);
      return res.ok;
    } catch {
      return false;
    }
  }
}
