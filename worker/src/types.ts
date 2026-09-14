/**
 * OTL Web System - 類型定義
 */

export interface Env {
  OTL_STORE: KVNamespace;
  // 內建 RSA 公鑰（PEM 格式，X.509 SubjectPublicKeyInfo）
  // 部署時可透過 wrangler secret 覆蓋，也可留空使用程式內建預設值
  RSA_PUBLIC_KEY_PEM?: string;
}

/** KV 中儲存的令牌紀錄 */
export interface TokenRecord {
  token: string;
  targetUrl: string;
  createdAt: number;
  expirationTime: number; // 秒
  used: boolean;
  usedAt: number | null;
  /** 建立時的 RSA 加密令牌（Base64），僅供展示/稽核用 */
  encryptedTokenB64?: string;
  /** 建立時使用的鹽（Base64），僅供展示/稽核用 */
  saltB64?: string;
}

/** 存取紀錄（訪問一次性連結時寫入） */
export interface AccessLog {
  token: string;
  timestamp: number;
  userAgent: string;
  ip: string;
  action: "view" | "confirmed" | "expired_attempt" | "used_attempt";
}
