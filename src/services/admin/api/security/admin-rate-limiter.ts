// src/services/admin/api/security/admin-rate-limiter.ts - Aplica rate limit por usuario e IP para mutaciones administrativas.
import { NextRequest } from "next/server";
import { consumeSecurityRateLimit } from "@/services/security/api/rate-limit/security-rate-limiter";
import { resolveRequestClientIp } from "@/services/security/api/request-client-ip";

interface IAdminRateLimitFingerprint {
  ip: string;
  userKey: string;
}

function isStrictRateLimitFlagEnabled(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

// Permite activar políticas fail-closed por entorno para mutaciones administrativas.
function resolveAdminRateLimitOptions(): { requireDistributedBackend: boolean; failClosedOnDistributedError: boolean } {
  return {
    requireDistributedBackend: isStrictRateLimitFlagEnabled(process.env.ADMIN_RATE_LIMIT_REQUIRE_DISTRIBUTED),
    failClosedOnDistributedError: isStrictRateLimitFlagEnabled(process.env.ADMIN_RATE_LIMIT_FAIL_CLOSED),
  };
}

function buildFingerprint(request: NextRequest, userId: string): IAdminRateLimitFingerprint {
  return { ip: resolveRequestClientIp(request), userKey: userId.trim().toLowerCase() };
}

/**
 * Protege endpoints admin contra ráfagas: límite por usuario y por IP para cada operación.
 */
export async function consumeAdminMutationRateLimit(request: NextRequest, userId: string, operation: string): Promise<boolean> {
  const fingerprint = buildFingerprint(request, userId);
  const normalizedOperation = operation.trim().toLowerCase();
  const rateLimitOptions = resolveAdminRateLimitOptions();
  const userAllowed = await consumeSecurityRateLimit(
    `admin:mutation:user:${normalizedOperation}:${fingerprint.userKey}`,
    45,
    60_000,
    rateLimitOptions,
  );
  if (!userAllowed) return false;
  return consumeSecurityRateLimit(`admin:mutation:ip:${normalizedOperation}:${fingerprint.ip}`, 80, 60_000, rateLimitOptions);
}

