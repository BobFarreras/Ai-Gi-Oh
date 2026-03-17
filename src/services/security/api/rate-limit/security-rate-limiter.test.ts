// src/services/security/api/rate-limit/security-rate-limiter.test.ts - Asegura comportamiento local del rate limiter y reset para tests.
import { afterEach, describe, expect, it } from "vitest";
import {
  consumeSecurityRateLimit,
  resetSecurityRateLimiterForTests,
} from "@/services/security/api/rate-limit/security-rate-limiter";

describe("consumeSecurityRateLimit (fallback local)", () => {
  afterEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    resetSecurityRateLimiterForTests();
  });

  it("permite hasta maxAttempts y bloquea el exceso", async () => {
    const key = "test:security-rate-limit";
    expect(await consumeSecurityRateLimit(key, 2, 60_000)).toBe(true);
    expect(await consumeSecurityRateLimit(key, 2, 60_000)).toBe(true);
    expect(await consumeSecurityRateLimit(key, 2, 60_000)).toBe(false);
  });

  it("resetea estado entre pruebas", async () => {
    const key = "test:security-rate-limit-reset";
    expect(await consumeSecurityRateLimit(key, 1, 60_000)).toBe(true);
    resetSecurityRateLimiterForTests();
    expect(await consumeSecurityRateLimit(key, 1, 60_000)).toBe(true);
  });
});
