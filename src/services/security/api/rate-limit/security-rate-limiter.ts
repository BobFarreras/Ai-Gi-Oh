// src/services/security/api/rate-limit/security-rate-limiter.ts - Implementa rate limiting con backend distribuido opcional y fallback local en memoria.
interface IRateBucket {
  count: number;
  resetAtMs: number;
}

interface ISecurityRateLimitOptions {
  requireDistributedBackend?: boolean;
  failClosedOnDistributedError?: boolean;
}

const localBuckets = new Map<string, IRateBucket>();

// Mantiene un timeout acotado para evitar que una degradación externa bloquee demasiado la API.
function resolveDistributedLimiterTimeoutMs(): number {
  const parsedValue = Number(process.env.SECURITY_RATE_LIMIT_DISTRIBUTED_TIMEOUT_MS ?? "1200");
  if (!Number.isFinite(parsedValue)) return 1200;
  return Math.min(Math.max(Math.trunc(parsedValue), 200), 5000);
}

function cleanupExpiredLocalBuckets(nowMs: number): void {
  if (localBuckets.size < 4000) return;
  for (const [key, bucket] of localBuckets.entries()) {
    if (bucket.resetAtMs <= nowMs) localBuckets.delete(key);
  }
}

function consumeLocalRateLimit(key: string, maxAttempts: number, windowMs: number): boolean {
  const nowMs = Date.now();
  cleanupExpiredLocalBuckets(nowMs);
  const currentBucket = localBuckets.get(key);
  if (!currentBucket || currentBucket.resetAtMs <= nowMs) {
    localBuckets.set(key, { count: 1, resetAtMs: nowMs + windowMs });
    return true;
  }
  if (currentBucket.count >= maxAttempts) return false;
  currentBucket.count += 1;
  localBuckets.set(key, currentBucket);
  return true;
}

function resolveDistributedLimiterConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return { url, token };
}

async function consumeDistributedRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number,
  config: { url: string; token: string },
): Promise<boolean> {
  const abortController = new AbortController();
  const timeoutMs = resolveDistributedLimiterTimeoutMs();
  const timeoutHandle = setTimeout(() => abortController.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(`${config.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      signal: abortController.signal,
      body: JSON.stringify([
        ["INCR", key],
        ["PEXPIRE", key, String(windowMs), "NX"],
      ]),
    });
  } finally {
    clearTimeout(timeoutHandle);
  }
  if (!response.ok) {
    throw new Error("Distributed rate limiter request failed.");
  }
  const payload = (await response.json()) as Array<{ result?: number | string }>;
  const currentCount = Number(payload?.[0]?.result ?? 0);
  return Number.isFinite(currentCount) && currentCount <= maxAttempts;
}

/**
 * Consume un token de rate limit para una clave concreta.
 * Usa backend distribuido (Upstash REST) cuando está configurado.
 * Permite modo estricto para rechazar si falta backend distribuido o si el backend falla.
 */
export async function consumeSecurityRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number,
  options: ISecurityRateLimitOptions = {},
): Promise<boolean> {
  const distributedConfig = resolveDistributedLimiterConfig();
  if (!distributedConfig) {
    if (options.requireDistributedBackend === true) return false;
    return consumeLocalRateLimit(key, maxAttempts, windowMs);
  }
  try {
    return await consumeDistributedRateLimit(key, maxAttempts, windowMs, distributedConfig);
  } catch {
    if (options.failClosedOnDistributedError === true) return false;
    return consumeLocalRateLimit(key, maxAttempts, windowMs);
  }
}

export function resetSecurityRateLimiterForTests(): void {
  localBuckets.clear();
}
