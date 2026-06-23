// src/services/analytics/api/security/analytics-rate-limiter.ts - Aplica rate limit por IP para ingesta de analytics.
import { NextRequest } from "next/server";
import { consumeSecurityRateLimit } from "@/services/security/api/rate-limit/security-rate-limiter";
import { resolveRequestClientIp } from "@/services/security/api/request-client-ip";

function isStrictRateLimitFlagEnabled(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

function resolveAnalyticsRateLimitOptions(): { requireDistributedBackend: boolean; failClosedOnDistributedError: boolean } {
  return {
    requireDistributedBackend: isStrictRateLimitFlagEnabled(process.env.ANALYTICS_RATE_LIMIT_REQUIRE_DISTRIBUTED),
    failClosedOnDistributedError: isStrictRateLimitFlagEnabled(process.env.ANALYTICS_RATE_LIMIT_FAIL_CLOSED),
  };
}

/**
 * Protege el endpoint de ingesta contra ráfagas: 10 batches/minuto por IP.
 */
export async function consumeAnalyticsBatchRateLimit(request: NextRequest): Promise<boolean> {
  const ip = resolveRequestClientIp(request);
  return consumeSecurityRateLimit(`analytics:batch:ip:${ip}`, 10, 60_000, resolveAnalyticsRateLimitOptions());
}
