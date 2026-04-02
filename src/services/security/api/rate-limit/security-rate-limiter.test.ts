// src/services/security/api/rate-limit/security-rate-limiter.test.ts - Asegura comportamiento local del rate limiter y reset para tests.
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  consumeSecurityRateLimit,
  resetSecurityRateLimiterForTests,
} from "@/services/security/api/rate-limit/security-rate-limiter";

describe("consumeSecurityRateLimit (fallback local)", () => {
  afterEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    vi.unstubAllGlobals();
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

  it("rechaza en modo estricto si no existe backend distribuido", async () => {
    const key = "test:security-rate-limit-strict-no-backend";
    expect(await consumeSecurityRateLimit(key, 1, 60_000, { requireDistributedBackend: true })).toBe(false);
  });

  it("rechaza en modo fail-closed cuando falla el backend distribuido", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://upstash.example";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValueOnce(new Error("network error")));
    const key = "test:security-rate-limit-strict-fail-closed";
    expect(
      await consumeSecurityRateLimit(key, 1, 60_000, {
        requireDistributedBackend: true,
        failClosedOnDistributedError: true,
      }),
    ).toBe(false);
  });

  it("degrada a memoria local cuando falla distribuido y fail-closed está desactivado", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://upstash.example";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValueOnce(new Error("network error")));
    const key = "test:security-rate-limit-strict-fallback-local";
    expect(await consumeSecurityRateLimit(key, 1, 60_000, { requireDistributedBackend: true })).toBe(true);
  });
});
