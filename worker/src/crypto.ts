/**
 * OTL Web System - 加密模組
 *
 * 使用 Web Crypto API（Cloudflare Workers 原生支援，不需要額外依賴）
 * 對應原 Qt 版 CryptoEngine 的功能：
 *   - SHA-512 雜湊
 *   - RSA-4096 OAEP 公鑰加密
 *   - Base64 / Base64URL 編碼
 *
 * 注意：後端 KV 存的是「明文 token」（與原設計一致），
 * RSA 加密只是用來產生「加密令牌」供前端展示 / 保留原本連結格式，
 * 並不影響 Worker 內部的驗證與銷毀邏輯。
 */

// ============================================================================
// Base64 / Base64URL 工具
// ============================================================================

export function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function base64UrlEncode(buffer: ArrayBuffer): string {
  return bufferToBase64(buffer)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function base64UrlDecode(input: string): ArrayBuffer {
  let s = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4;
  if (pad === 2) s += "==";
  else if (pad === 3) s += "=";
  return base64ToBuffer(s);
}

// ============================================================================
// SHA-512
// ============================================================================

export async function sha512(data: Uint8Array): Promise<ArrayBuffer> {
  return crypto.subtle.digest("SHA-512", data);
}

// ============================================================================
// 隨機鹽 / 隨機 bytes
// ============================================================================

export function generateSalt(length = 16): Uint8Array {
  const salt = new Uint8Array(length);
  crypto.getRandomValues(salt);
  return salt;
}

// ============================================================================
// PEM -> CryptoKey（匯入 RSA 公鑰）
// ============================================================================

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const cleaned = pem
    .replace(/-----BEGIN PUBLIC KEY-----/, "")
    .replace(/-----END PUBLIC KEY-----/, "")
    .replace(/\s+/g, "");
  return base64ToBuffer(cleaned);
}

let cachedPublicKey: CryptoKey | null = null;
let cachedPublicKeyPem: string | null = null;

/**
 * 匯入（並快取）RSA-OAEP 公鑰。
 * 對應原 Qt 版 public.pem（X.509 SubjectPublicKeyInfo，SHA-256 for OAEP）。
 */
export async function importRsaPublicKey(pem: string): Promise<CryptoKey> {
  if (cachedPublicKey && cachedPublicKeyPem === pem) {
    return cachedPublicKey;
  }

  const keyData = pemToArrayBuffer(pem);
  const key = await crypto.subtle.importKey(
    "spki",
    keyData,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    false,
    ["encrypt"]
  );

  cachedPublicKey = key;
  cachedPublicKeyPem = pem;
  return key;
}

/**
 * RSA-OAEP 加密任意資料（用來加密 token 明文，僅供展示 / 保留格式）
 */
export async function encryptRSA(
  plaintext: Uint8Array,
  publicKeyPem: string
): Promise<ArrayBuffer> {
  const key = await importRsaPublicKey(publicKeyPem);
  return crypto.subtle.encrypt({ name: "RSA-OAEP" }, key, plaintext);
}

// ============================================================================
// 高階組合函式：對應原 Qt 版 OTLGenerator 的雜湊 + 加密流程
// ============================================================================

export interface EncryptedTokenBundle {
  /** SHA512(targetUrl + salt) 的結果 */
  urlHash: ArrayBuffer;
  /** RSA-OAEP 加密後的 token（原始明文 token 仍另外存於 KV） */
  encryptedToken: ArrayBuffer;
  /** 本次使用的鹽 */
  salt: Uint8Array;
}

export async function buildEncryptedBundle(
  targetUrl: string,
  token: string,
  publicKeyPem: string
): Promise<EncryptedTokenBundle> {
  const salt = generateSalt(16);
  const encoder = new TextEncoder();

  const urlBytes = encoder.encode(targetUrl);
  const combined = new Uint8Array(urlBytes.length + salt.length);
  combined.set(urlBytes, 0);
  combined.set(salt, urlBytes.length);

  const urlHash = await sha512(combined);
  const encryptedToken = await encryptRSA(encoder.encode(token), publicKeyPem);

  return { urlHash, encryptedToken, salt };
}

/** 產生 UUID v4（Workers 執行環境原生支援 crypto.randomUUID） */
export function generateUUID(): string {
  return crypto.randomUUID();
}
