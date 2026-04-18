// src/services/player-profile/api/security/player-profile-rate-limiter.test.ts - Garantiza flags de modo estricto en consumo de rate-limit de perfil.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { consumePlayerProfileRateLimit } from "@/services/player-profile/api/security/player-profile-rate-limiter";

const consumeSecurityRateLimitMock = vi.hoisted(() => vi.fn());

vi.mock("@/services/security/api/rate-limit/security-rate-limiter", () => ({
  consumeSecurityRateLimit: consumeSecurityRateLimitMock,
  resetSecurityRateLimiterForTests: vi.fn(),
}));

describe("consumePlayerProfileRateLimit", () => {
  beforeEach(() => {
    consumeSecurityRateLimitMock.mockResolvedValue(true);
    delete process.env.PLAYER_PROFILE_RATE_LIMIT_REQUIRE_DISTRIBUTED;
    delete process.env.PLAYER_PROFILE_RATE_LIMIT_FAIL_CLOSED;
  });

  it("usa modo relajado por defecto", async () => {
    await consumePlayerProfileRateLimit("profile:key", 3, 1000);
    expect(consumeSecurityRateLimitMock).toHaveBeenCalledWith("profile:key", 3, 1000, {
      requireDistributedBackend: false,
      failClosedOnDistributedError: false,
    });
  });

  it("aplica modo estricto cuando flags están activadas", async () => {
    process.env.PLAYER_PROFILE_RATE_LIMIT_REQUIRE_DISTRIBUTED = "true";
    process.env.PLAYER_PROFILE_RATE_LIMIT_FAIL_CLOSED = "true";
    await consumePlayerProfileRateLimit("profile:key", 4, 2000);
    expect(consumeSecurityRateLimitMock).toHaveBeenCalledWith("profile:key", 4, 2000, {
      requireDistributedBackend: true,
      failClosedOnDistributedError: true,
    });
  });
});
