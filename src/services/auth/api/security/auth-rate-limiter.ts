// src/services/auth/api/security/auth-rate-limiter.ts - Adaptador de rate limiting de auth sobre backend distribuido con fallback local.
import {
  consumeSecurityRateLimit,
  resetSecurityRateLimiterForTests,
} from "@/services/security/api/rate-limit/security-rate-limiter";

export async function consumeAuthRateLimit(key: string, maxAttempts: number, windowMs: number): Promise<boolean> {
  return consumeSecurityRateLimit(key, maxAttempts, windowMs);
}

export function resetAuthRateLimiterForTests(): void {
  resetSecurityRateLimiterForTests();
}
