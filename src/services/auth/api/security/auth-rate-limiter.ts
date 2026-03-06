// src/services/auth/api/security/auth-rate-limiter.ts - Rate limiter en memoria para mitigar fuerza bruta en endpoints de autenticación.
interface IRateBucket {
  count: number;
  resetAtMs: number;
}

const buckets = new Map<string, IRateBucket>();

function cleanupExpiredBuckets(nowMs: number): void {
  if (buckets.size < 4000) return;
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAtMs <= nowMs) {
      buckets.delete(key);
    }
  }
}

export function consumeAuthRateLimit(key: string, maxAttempts: number, windowMs: number): boolean {
  const nowMs = Date.now();
  cleanupExpiredBuckets(nowMs);
  const currentBucket = buckets.get(key);
  if (!currentBucket || currentBucket.resetAtMs <= nowMs) {
    buckets.set(key, { count: 1, resetAtMs: nowMs + windowMs });
    return true;
  }
  if (currentBucket.count >= maxAttempts) {
    return false;
  }
  currentBucket.count += 1;
  buckets.set(key, currentBucket);
  return true;
}

export function resetAuthRateLimiterForTests(): void {
  buckets.clear();
}
