// src/services/survival/api/security/survival-rate-limiter.ts - Acota el gasto de las rutas PvE autoritativas, sobre todo el replay.
import {
  consumeSecurityRateLimit,
  resetSecurityRateLimiterForTests,
} from "@/services/security/api/rate-limit/security-rate-limiter";

function isStrictFlagEnabled(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

/** Permite endurecer los límites por entorno sin tocar las rutas HTTP. */
function resolveSurvivalRateLimitOptions(): { requireDistributedBackend: boolean; failClosedOnDistributedError: boolean } {
  return {
    requireDistributedBackend: isStrictFlagEnabled(process.env.SURVIVAL_RATE_LIMIT_REQUIRE_DISTRIBUTED),
    failClosedOnDistributedError: isStrictFlagEnabled(process.env.SURVIVAL_RATE_LIMIT_FAIL_CLOSED),
  };
}

export async function consumeSurvivalRateLimit(key: string, maxAttempts: number, windowMs: number): Promise<boolean> {
  return consumeSecurityRateLimit(key, maxAttempts, windowMs, resolveSurvivalRateLimitOptions());
}

export function resetSurvivalRateLimiterForTests(): void {
  resetSecurityRateLimiterForTests();
}
