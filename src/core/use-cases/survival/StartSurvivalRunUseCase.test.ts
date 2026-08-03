// src/core/use-cases/survival/StartSurvivalRunUseCase.test.ts - Verifica inicio idempotente y cierre de expediciones abandonadas.
import { describe, expect, it, vi } from "vitest";
import { ISurvivalRepository } from "@/core/repositories/ISurvivalRepository";
import { ISurvivalBattle, ISurvivalRun } from "@/core/entities/survival/ISurvival";
import { COMBAT_PROOF_PROTOCOL_VERSION } from "@/core/entities/match";
import { GameState } from "@/core/use-cases/GameEngine";
import { StartSurvivalRunUseCase } from "./StartSurvivalRunUseCase";

const run = { id: "run-1", playerId: "player-1" } as ISurvivalRun;
const progress = { bestWins: 12, ascensionFragments: 90 };
const configuration = { ruleset: { version: 3, milestoneInterval: 5 }, stages: [] };
const pendingBattle = { battleId: "battle-7", runId: "run-1" } as ISurvivalBattle;
const playableSnapshot = {
  playerA: { hand: [{}, {}, {}, {}] },
  playerB: { hand: [{}, {}, {}, {}] },
} as GameState;
const NOW_ISO = "2026-08-01T12:00:00.000Z";

describe("StartSurvivalRunUseCase", () => {
  it("reanuda la run activa sin crear otra", async () => {
    const repository = {
      getActiveRun: vi.fn().mockResolvedValue(run),
      getIssuedBattle: vi.fn().mockResolvedValue(null),
      getRuleset: vi.fn().mockResolvedValue(configuration),
      getProgress: vi.fn().mockResolvedValue(progress),
      startRun: vi.fn(),
    } as unknown as ISurvivalRepository;
    const result = await new StartSurvivalRunUseCase(repository).execute("player-1", 8000, NOW_ISO);
    expect(result).toEqual({ run, progress, resumed: true, forfeitedPreviousRun: false, milestoneInterval: 5 });
    expect(repository.startRun).not.toHaveBeenCalled();
  });

  it("mantiene la run cuando el combate pendiente sigue vigente", async () => {
    const repository = {
      getActiveRun: vi.fn().mockResolvedValue(run),
      getIssuedBattle: vi.fn().mockResolvedValue(pendingBattle),
      getCombatSession: vi.fn().mockResolvedValue({
        session: { protocolVersion: COMBAT_PROOF_PROTOCOL_VERSION, expiresAtIso: "2026-08-01T12:30:00.000Z" },
        snapshot: playableSnapshot,
      }),
      getProgress: vi.fn().mockResolvedValue(progress),
      getRuleset: vi.fn().mockResolvedValue(configuration),
      forfeitIssuedBattle: vi.fn(),
      startRun: vi.fn(),
    } as unknown as ISurvivalRepository;
    const result = await new StartSurvivalRunUseCase(repository).execute("player-1", 8000, NOW_ISO);
    expect(result).toEqual({ run, progress, resumed: true, forfeitedPreviousRun: false, milestoneInterval: 5 });
    expect(repository.forfeitIssuedBattle).not.toHaveBeenCalled();
  });

  it("liquida como derrota el combate abandonado y arranca una expedición nueva", async () => {
    const freshRun = { ...run, id: "run-2" };
    const repository = {
      getActiveRun: vi.fn().mockResolvedValue(run),
      getIssuedBattle: vi.fn().mockResolvedValue(pendingBattle),
      getCombatSession: vi.fn().mockResolvedValue({
        session: { protocolVersion: COMBAT_PROOF_PROTOCOL_VERSION, expiresAtIso: "2026-08-01T11:00:00.000Z" },
        snapshot: playableSnapshot,
      }),
      forfeitIssuedBattle: vi.fn().mockResolvedValue({ ...run, status: "COMPLETED_DEFEAT" }),
      getRuleset: vi.fn().mockResolvedValue(configuration),
      startRun: vi.fn().mockResolvedValue(freshRun),
      getProgress: vi.fn().mockResolvedValue(progress),
    } as unknown as ISurvivalRepository;

    const result = await new StartSurvivalRunUseCase(repository).execute("player-1", 8000, NOW_ISO);

    expect(repository.forfeitIssuedBattle).toHaveBeenCalledWith("player-1", "battle-7");
    expect(repository.startRun).toHaveBeenCalledWith("player-1", 8000, 3);
    expect(result).toEqual({ run: freshRun, progress, resumed: false, forfeitedPreviousRun: true, milestoneInterval: 5 });
  });

  it("no castiga un snapshot incompatible aunque haya caducado", async () => {
    const repository = {
      getActiveRun: vi.fn().mockResolvedValue(run),
      getIssuedBattle: vi.fn().mockResolvedValue(pendingBattle),
      getCombatSession: vi.fn().mockResolvedValue({
        session: { protocolVersion: COMBAT_PROOF_PROTOCOL_VERSION, expiresAtIso: "2026-08-01T11:00:00.000Z" },
        snapshot: { playerA: { hand: [{}, {}, {}] }, playerB: { hand: [{}, {}, {}] } } as GameState,
      }),
      forfeitIssuedBattle: vi.fn(),
      getProgress: vi.fn().mockResolvedValue(progress),
      getRuleset: vi.fn().mockResolvedValue(configuration),
      startRun: vi.fn(),
    } as unknown as ISurvivalRepository;

    const result = await new StartSurvivalRunUseCase(repository).execute("player-1", 8000, NOW_ISO);

    expect(repository.forfeitIssuedBattle).not.toHaveBeenCalled();
    expect(result).toEqual({ run, progress, resumed: true, forfeitedPreviousRun: false, milestoneInterval: 5 });
  });

  it("crea una run con la versión activa", async () => {
    const repository = {
      getActiveRun: vi.fn().mockResolvedValue(null),
      getRuleset: vi.fn().mockResolvedValue(configuration),
      startRun: vi.fn().mockResolvedValue(run),
      getProgress: vi.fn().mockResolvedValue(progress),
    } as unknown as ISurvivalRepository;
    await expect(new StartSurvivalRunUseCase(repository).execute("player-1", 8000, NOW_ISO))
      .resolves.toEqual({ run, progress, resumed: false, forfeitedPreviousRun: false, milestoneInterval: 5 });
    expect(repository.startRun).toHaveBeenCalledWith("player-1", 8000, 3);
  });
});
