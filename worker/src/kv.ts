/**
 * OTL Web System - KV 操作層
 */

import type { TokenRecord, AccessLog } from "./types";

export async function createTokenRecord(
  kv: KVNamespace,
  token: string,
  targetUrl: string,
  expirationSeconds: number,
  encryptedTokenB64?: string,
  saltB64?: string
): Promise<void> {
  const record: TokenRecord = {
    token,
    targetUrl,
    createdAt: Date.now(),
    expirationTime: expirationSeconds,
    used: false,
    usedAt: null,
    encryptedTokenB64,
    saltB64,
  };

  await kv.put(`token:${token}`, JSON.stringify(record), {
    expirationTtl: expirationSeconds,
  });
}

export async function getTokenRecord(
  kv: KVNamespace,
  token: string
): Promise<TokenRecord | null> {
  const data = await kv.get(`token:${token}`, "json");
  return data as TokenRecord | null;
}

export async function markTokenAsUsed(
  kv: KVNamespace,
  token: string
): Promise<TokenRecord | null> {
  const record = await getTokenRecord(kv, token);
  if (!record) return null;

  record.used = true;
  record.usedAt = Date.now();

  await kv.put(`token:${token}`, JSON.stringify(record), {
    expirationTtl: record.expirationTime,
  });

  return record;
}

export async function deleteTokenRecord(
  kv: KVNamespace,
  token: string
): Promise<void> {
  await kv.delete(`token:${token}`);
}

export async function logAccess(
  kv: KVNamespace,
  token: string,
  userAgent: string,
  ip: string,
  action: AccessLog["action"]
): Promise<void> {
  const log: AccessLog = {
    token,
    timestamp: Date.now(),
    userAgent,
    ip,
    action,
  };

  await kv.put(`access:${token}:${Date.now()}`, JSON.stringify(log), {
    expirationTtl: 7 * 24 * 3600, // 7 天
  });
}

export async function listActiveTokens(
  kv: KVNamespace
): Promise<TokenRecord[]> {
  const result = await kv.list({ prefix: "token:" });
  const tokens: TokenRecord[] = [];

  for (const key of result.keys) {
    const record = (await kv.get(key.name, "json")) as TokenRecord | null;
    if (record && !record.used) {
      tokens.push(record);
    }
  }

  return tokens;
}

export async function getTokenStats(kv: KVNamespace): Promise<{
  total: number;
  active: number;
  used: number;
}> {
  const result = await kv.list({ prefix: "token:" });
  let total = 0;
  let active = 0;
  let used = 0;

  for (const key of result.keys) {
    total++;
    const record = (await kv.get(key.name, "json")) as TokenRecord | null;
    if (record) {
      if (record.used) used++;
      else active++;
    }
  }

  return { total, active, used };
}
