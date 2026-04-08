// src/services/auth/api/security/auth-rate-limiter.ts - Adaptador de rate limiting de auth sobre backend distribuido con fallback local.
import {
  consumeSecurityRateLimit,
  resetSecurityRateLimiterForTests,
} from "@/services/security/api/rate-limit/security-rate-limiter";

function isStrictRateLimitFlagEnabled(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

// Centraliza la lectura de flags para poder endurecer auth sin cambiar llamadas de negocio.
function resolveAuthRateLimitOptions(): { requireDistributedBackend: boolean; failClosedOnDistributedError: boolean } {
  return {
    requireDistributedBackend: isStrictRateLimitFlagEnabled(process.env.AUTH_RATE_LIMIT_REQUIRE_DISTRIBUTED),
    failClosedOnDistributedError: isStrictRateLimitFlagEnabled(process.env.AUTH_RATE_LIMIT_FAIL_CLOSED),
  };
}

export async function consumeAuthRateLimit(key: string, maxAttempts: number, windowMs: number): Promise<boolean> {
  return consumeSecurityRateLimit(key, maxAttempts, windowMs, resolveAuthRateLimitOptions());
}

export function resetAuthRateLimiterForTests(): void {
  resetSecurityRateLimiterForTests();
}
