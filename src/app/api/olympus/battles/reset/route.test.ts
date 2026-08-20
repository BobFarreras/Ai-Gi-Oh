// src/app/api/olympus/battles/reset/route.test.ts - Verifica la recuperación autenticada de una batalla de Olimpo.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { IOlympusRepository } from "@/core/repositories/IOlympusRepository";
import { resetPveRateLimiterForTests } from "@/services/security/api/rate-limit/pve-rate-limiter";

const { repository } = vi.hoisted(() => ({
  repository: {
    getIssuedBattle: vi.fn().mockResolvedValue({ battleId: "battle-1" }),
    forfeitIssuedBattle: vi.fn().mockResolvedValue({ battleId: "battle-1", status: "COMPLETED", outcome: "LOSS" }),
  },
}));

vi.mock("@/services/security/api/require-trusted-mutation-origin", () => ({ requireTrustedMutationOrigin: () => null }));
vi.mock("@/services/olympus/create-olympus-route-context", () => ({
  createOlympusRouteContext: vi.fn().mockResolvedValue({
    playerId: "player-1", repository: repository as unknown as IOlympusRepository,
    response: { headers: new Headers() },
  }),
}));

import { POST } from "./route";

describe("POST /api/olympus/battles/reset", () => {
  beforeEach(() => resetPveRateLimiterForTests());

  it("cierra la batalla pendiente y conserva el intento ya consumido", async () => {
    const request = { headers: new Headers({ "x-forwarded-for": "203.0.113.21" }) } as unknown as NextRequest;
    const response = await POST(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ forfeited: true, battle: { battleId: "battle-1" } });
    expect(repository.forfeitIssuedBattle).toHaveBeenCalledWith("player-1", "battle-1");
  });
});
