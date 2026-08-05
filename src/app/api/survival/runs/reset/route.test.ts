// src/app/api/survival/runs/reset/route.test.ts - Verifica la recuperación autenticada de una expedición bloqueada.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { ISurvivalRepository } from "@/core/repositories/ISurvivalRepository";
import { resetPveRateLimiterForTests } from "@/services/security/api/rate-limit/pve-rate-limiter";

const { repository } = vi.hoisted(() => ({
  repository: {
    getActiveRun: vi.fn().mockResolvedValue({ id: "run-1" }),
    getIssuedBattle: vi.fn().mockResolvedValue({ battleId: "battle-1" }),
    forfeitIssuedBattle: vi.fn().mockResolvedValue({ status: "COMPLETED_DEFEAT" }),
    getRuleset: vi.fn().mockResolvedValue({ ruleset: { version: 2, milestoneInterval: 5, milestoneHeal: 2000 }, stages: [] }),
    startRun: vi.fn().mockResolvedValue({ id: "run-2", status: "ACTIVE" }),
    getProgress: vi.fn().mockResolvedValue({ bestWins: 4, ascensionFragments: 12 }),
  },
}));

vi.mock("@/services/security/api/require-trusted-mutation-origin", () => ({
  requireTrustedMutationOrigin: () => null,
}));
vi.mock("@/services/survival/create-survival-route-context", () => ({
  createSurvivalRouteContext: vi.fn().mockResolvedValue({
    playerId: "player-1", repository: repository as unknown as ISurvivalRepository,
    response: { headers: new Headers() },
  }),
}));
vi.mock("@/services/survival/get-survival-starting-lp", () => ({
  getSurvivalStartingLp: vi.fn().mockResolvedValue(8500),
}));

import { POST } from "./route";

describe("POST /api/survival/runs/reset", () => {
  beforeEach(() => resetPveRateLimiterForTests());

  it("cierra la batalla pendiente y devuelve una run nueva", async () => {
    const request = { headers: new Headers({ "x-forwarded-for": "203.0.113.20" }) } as unknown as NextRequest;
    const response = await POST(request);

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({ run: { id: "run-2" }, forfeitedPreviousRun: true });
    expect(repository.forfeitIssuedBattle).toHaveBeenCalledWith("player-1", "battle-1");
  });
});
