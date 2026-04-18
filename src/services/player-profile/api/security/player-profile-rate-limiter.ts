// src/services/player-profile/api/security/player-profile-rate-limiter.ts - Encapsula límites de mutación de perfil con opción estricta distribuida.
import {
  consumeSecurityRateLimit,
  resetSecurityRateLimiterForTests,
} from "@/services/security/api/rate-limit/security-rate-limiter";

function isStrictFlagEnabled(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

/**
 * Permite endurecer límites de perfil por entorno sin modificar rutas HTTP.
 */
function resolveProfileRateLimitOptions(): { requireDistributedBackend: boolean; failClosedOnDistributedError: boolean } {
  return {
    requireDistributedBackend: isStrictFlagEnabled(process.env.PLAYER_PROFILE_RATE_LIMIT_REQUIRE_DISTRIBUTED),
    failClosedOnDistributedError: isStrictFlagEnabled(process.env.PLAYER_PROFILE_RATE_LIMIT_FAIL_CLOSED),
  };
}

export async function consumePlayerProfileRateLimit(key: string, maxAttempts: number, windowMs: number): Promise<boolean> {
  return consumeSecurityRateLimit(key, maxAttempts, windowMs, resolveProfileRateLimitOptions());
}

export function resetPlayerProfileRateLimiterForTests(): void {
  resetSecurityRateLimiterForTests();
}
