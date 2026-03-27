// src/services/admin/api/security/admin-rate-limiter.test.ts - Verifica límite por usuario/IP en mutaciones admin usando fallback local.
import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { consumeAdminMutationRateLimit } from "@/services/admin/api/security/admin-rate-limiter";
import { resetSecurityRateLimiterForTests } from "@/services/security/api/rate-limit/security-rate-limiter";

function createRequest(ip: string): NextRequest {
  return new NextRequest("http://localhost:3000/api/admin/catalog/cards", {
    method: "POST",
    headers: { "x-forwarded-for": ip },
  });
}

describe("consumeAdminMutationRateLimit", () => {
  afterEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    resetSecurityRateLimiterForTests();
  });

  it("bloquea al superar el límite por usuario para una operación", async () => {
    const request = createRequest("10.20.30.40");
    for (let index = 0; index < 45; index += 1) {
      await expect(consumeAdminMutationRateLimit(request, "admin-1", "catalog-cards")).resolves.toBe(true);
    }
    await expect(consumeAdminMutationRateLimit(request, "admin-1", "catalog-cards")).resolves.toBe(false);
  });

  it("mantiene contadores aislados por operación", async () => {
    const request = createRequest("10.20.30.41");
    for (let index = 0; index < 45; index += 1) {
      await consumeAdminMutationRateLimit(request, "admin-2", "catalog-cards");
    }
    await expect(consumeAdminMutationRateLimit(request, "admin-2", "story-decks")).resolves.toBe(true);
  });
});

