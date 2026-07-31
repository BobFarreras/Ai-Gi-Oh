// src/app/api/survival/runs/start/route.test.ts - Verifica reanudación idempotente desde la API.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { resetSurvivalRateLimiterForTests } from "@/services/survival/api/security/survival-rate-limiter";
import { ISurvivalRepository } from "@/core/repositories/ISurvivalRepository";
import { COMBAT_PROOF_PROTOCOL_VERSION } from "@/core/entities/match";

const { repository } = vi.hoisted(() => ({
  repository: {
    getActiveRun: vi.fn().mockResolvedValue({ id: "run-1", playerId: "player-1", status: "ACTIVE" }),
    getIssuedBattle: vi.fn().mockResolvedValue(null),
    getCombatSession: vi.fn().mockResolvedValue(null),
    forfeitIssuedBattle: vi.fn(),
    getRuleset: vi.fn().mockResolvedValue({ ruleset: { version: 1, milestoneInterval: 5 }, stages: [] }),
    getProgress: vi.fn().mockResolvedValue({ bestWins: 6, ascensionFragments: 90 }),
    startRun: vi.fn(),
  },
}));

vi.mock("@/services/security/api/require-trusted-mutation-origin", () => ({
  requireTrustedMutationOrigin: () => null,
}));
vi.mock("@/services/survival/create-survival-route-context", () => ({
  createSurvivalRouteContext: vi.fn().mockResolvedValue({
    playerId: "player-1",
    repository: repository as unknown as ISurvivalRepository,
    response: { headers: new Headers() },
  }),
}));

import { POST } from "./route";

function buildRequest(): NextRequest {
  return { headers: new Headers({ "x-forwarded-for": "203.0.113.10" }) } as unknown as NextRequest;
}


describe("POST /api/survival/runs/start", () => {
  beforeEach(() => resetSurvivalRateLimiterForTests());

  it("devuelve la expedición activa sin duplicarla", async () => {
    const response = await POST(buildRequest());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      resumed: true,
      run: { id: "run-1" },
      progress: { bestWins: 6, ascensionFragments: 90 },
    });
    expect(repository.startRun).not.toHaveBeenCalled();
  });

  it("informa de la expedición cerrada al abandonar un combate", async () => {
    repository.getIssuedBattle.mockResolvedValueOnce({ battleId: "battle-3", runId: "run-1" });
    repository.getCombatSession.mockResolvedValueOnce({
      session: { protocolVersion: COMBAT_PROOF_PROTOCOL_VERSION, expiresAtIso: "2020-01-01T00:00:00.000Z" },
      snapshot: { playerA: { hand: [{}, {}, {}, {}] }, playerB: { hand: [{}, {}, {}, {}] } },
    });
    repository.forfeitIssuedBattle.mockResolvedValueOnce({ id: "run-1", status: "COMPLETED_DEFEAT" });
    repository.startRun.mockResolvedValueOnce({ id: "run-2", playerId: "player-1", status: "ACTIVE" });

    const response = await POST(buildRequest());

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      resumed: false,
      forfeitedPreviousRun: true,
      run: { id: "run-2" },
    });
    expect(repository.forfeitIssuedBattle).toHaveBeenCalledWith("player-1", "battle-3");
  });

  it("corta con 429 al agotar el cupo por jugador", async () => {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      await POST(buildRequest());
    }

    const response = await POST(buildRequest());

    expect(response.status).toBe(429);
  });
});
