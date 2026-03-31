// src/services/admin/api/security/admin-rate-limiter.ts - Aplica rate limit por usuario e IP para mutaciones administrativas.
import { NextRequest } from "next/server";
import { consumeSecurityRateLimit } from "@/services/security/api/rate-limit/security-rate-limiter";
import { resolveRequestClientIp } from "@/services/security/api/request-client-ip";

interface IAdminRateLimitFingerprint {
  ip: string;
  userKey: string;
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
  const userAllowed = await consumeSecurityRateLimit(`admin:mutation:user:${normalizedOperation}:${fingerprint.userKey}`, 45, 60_000);
  if (!userAllowed) return false;
  return consumeSecurityRateLimit(`admin:mutation:ip:${normalizedOperation}:${fingerprint.ip}`, 80, 60_000);
}

