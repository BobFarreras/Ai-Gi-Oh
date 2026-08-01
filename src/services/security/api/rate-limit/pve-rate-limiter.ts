// src/services/security/api/rate-limit/pve-rate-limiter.ts - Acota el gasto de las rutas PvE autoritativas, sobre todo el replay.
import {
  consumeSecurityRateLimit,
  resetSecurityRateLimiterForTests,
} from "@/services/security/api/rate-limit/security-rate-limiter";

function isStrictFlagEnabled(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

/**
 * Permite endurecer los límites por entorno sin tocar las rutas HTTP. Las variables conservan el
 * prefijo `SURVIVAL_` porque ya están desplegadas: el limitador es compartido, el nombre es histórico.
 */
function resolvePveRateLimitOptions(): { requireDistributedBackend: boolean; failClosedOnDistributedError: boolean } {
  return {
    requireDistributedBackend: isStrictFlagEnabled(process.env.SURVIVAL_RATE_LIMIT_REQUIRE_DISTRIBUTED),
    failClosedOnDistributedError: isStrictFlagEnabled(process.env.SURVIVAL_RATE_LIMIT_FAIL_CLOSED),
  };
}

export async function consumePveRateLimit(key: string, maxAttempts: number, windowMs: number): Promise<boolean> {
  return consumeSecurityRateLimit(key, maxAttempts, windowMs, resolvePveRateLimitOptions());
}

export function resetPveRateLimiterForTests(): void {
  resetSecurityRateLimiterForTests();
}
