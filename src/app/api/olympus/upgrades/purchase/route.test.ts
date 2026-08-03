// src/app/api/olympus/upgrades/purchase/route.test.ts - Verifica validación de payload y que el importe nunca llega del cliente.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { resetPveRateLimiterForTests } from "@/services/security/api/rate-limit/pve-rate-limiter";

const purchase = vi.fn().mockResolvedValue({ ascensionFragments: 160, progress: null });

vi.mock("@/services/security/api/require-trusted-mutation-origin", () => ({
  requireTrustedMutationOrigin: () => null,
}));
vi.mock("@/services/olympus/create-olympus-route-context", () => ({
  createOlympusRouteContext: vi.fn().mockResolvedValue({
    playerId: "player-1",
    repository: {},
    response: { headers: new Headers() },
  }),
}));
vi.mock("@/core/use-cases/olympus/ManageChampionUpgradesUseCase", () => ({
  ManageChampionUpgradesUseCase: class {
    purchase = purchase;
  },
}));

import { POST } from "./route";

function request(body: unknown): NextRequest {
  return {
    json: async () => body,
    headers: new Headers({ "x-forwarded-for": "203.0.113.30" }),
  } as unknown as NextRequest;
}

describe("POST /api/olympus/upgrades/purchase", () => {
  beforeEach(() => {
    resetPveRateLimiterForTests();
    purchase.mockClear();
  });

  it("exige campeón y nodo", async () => {
    const response = await POST(request({ championId: "gennvim" }));
    expect(response.status).toBe(400);
    expect(purchase).not.toHaveBeenCalled();
  });

  it("ignora cualquier coste o saldo declarado por el cliente", async () => {
    const response = await POST(request({
      championId: "gennvim", nodeId: "gennvim-power-1", fragmentCost: 0, ascensionFragments: 99999,
    }));
    expect(response.status).toBe(200);
    expect(purchase).toHaveBeenCalledWith("player-1", "gennvim", "gennvim-power-1");
    await expect(response.json()).resolves.toMatchObject({ ascensionFragments: 160 });
  });
});
