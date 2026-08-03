// src/core/use-cases/survival/IssueSurvivalBattleUseCase.test.ts - Verifica emisión server-side y reanudación.
import { describe, expect, it, vi } from "vitest";
import { ISurvivalRepository } from "@/core/repositories/ISurvivalRepository";
import { ISurvivalBattle, ISurvivalRun } from "@/core/entities/survival/ISurvival";
import { GameState } from "@/core/use-cases/GameEngine";
import { IssueSurvivalBattleUseCase } from "./IssueSurvivalBattleUseCase";
import { COMBAT_PROOF_PROTOCOL_VERSION } from "@/core/entities/match";

const run = {
  id: "run-1", playerId: "player-1", rulesetVersion: 1, currentBattleIndex: 0,
} as ISurvivalRun;
const battle = { battleId: "battle-1", runId: "run-1", battleIndex: 1 } as ISurvivalBattle;
const configuration = {
  ruleset: {
    id: "r", version: 1, startTier: 4, battlesPerTier: 2,
    roster: ["opponent-1"], milestoneInterval: 5, milestoneHeal: 2000,
  },
  stages: [{
    fromBattle: 1, aiProfile: "HARD" as const, maxTier: 8,
    maxLpBonus: 0, statBonusPerRank: 0, rewardDefinitionId: "base",
  }],
};

describe("IssueSurvivalBattleUseCase", () => {
  it("reanuda el combate pendiente sin crear snapshot nuevo", async () => {
    const snapshotFactory = vi.fn();
    const currentSnapshot = {
      playerA: { hand: [{}, {}, {}, {}] },
      playerB: { hand: [{}, {}, {}, {}] },
    } as GameState;
    const repository = {
      getActiveRun: vi.fn().mockResolvedValue(run),
      getIssuedBattle: vi.fn().mockResolvedValue(battle),
      getCombatSession: vi.fn().mockResolvedValue({
        session: {
          protocolVersion: COMBAT_PROOF_PROTOCOL_VERSION,
          expiresAtIso: "2026-08-02T00:00:00Z",
        },
        snapshot: currentSnapshot,
      }),
      getRuleset: vi.fn().mockResolvedValue(configuration),
    } as unknown as ISurvivalRepository;
    const result = await new IssueSurvivalBattleUseCase(repository, snapshotFactory)
      .execute({
        playerId: "player-1", runId: "run-1", battleId: "new", seed: "s",
        expiresAtIso: "2026-08-02T00:00:00Z", nowIso: "2026-08-01T00:00:00Z",
      });
    // La reanudación devuelve el encuentro para que el cliente anime con el perfil de IA del servidor.
    expect(result).toEqual({ battle, encounter: expect.objectContaining({ aiProfile: "HARD" }), resumed: true });
    expect(snapshotFactory).not.toHaveBeenCalled();
  });

  it("invalida una mano antigua de tres cartas y reemite el mismo índice", async () => {
    const refreshedRun = { ...run, currentBattleIndex: 0 };
    const snapshot = {
      playerA: { id: "player-1", hand: [{}, {}, {}] },
      playerB: { id: "opponent-1", hand: [{}, {}, {}] },
    } as GameState;
    const repository = {
      getActiveRun: vi.fn()
        .mockResolvedValueOnce({ ...run, currentBattleIndex: 1 })
        .mockResolvedValueOnce(refreshedRun),
      getIssuedBattle: vi.fn().mockResolvedValue(battle),
      getCombatSession: vi.fn().mockResolvedValue({
        session: { protocolVersion: COMBAT_PROOF_PROTOCOL_VERSION, expiresAtIso: "2026-08-02T08:00:00Z" },
        snapshot,
      }),
      invalidateIssuedBattle: vi.fn().mockResolvedValue(undefined),
      getRuleset: vi.fn().mockResolvedValue(configuration),
      issueBattle: vi.fn().mockResolvedValue(battle),
    } as unknown as ISurvivalRepository;
    const snapshotFactory = vi.fn().mockResolvedValue({ snapshot, snapshotHash: "new-hash" });

    const result = await new IssueSurvivalBattleUseCase(repository, snapshotFactory).execute({
      playerId: "player-1", runId: "run-1", battleId: "new-battle", seed: "new-seed",
      expiresAtIso: "2026-08-01T01:00:00Z", nowIso: "2026-08-01T00:00:00Z",
    });

    expect(repository.invalidateIssuedBattle).toHaveBeenCalledWith("player-1", "battle-1");
    expect(snapshotFactory).toHaveBeenCalledWith(refreshedRun, expect.objectContaining({ battleIndex: 1 }), "new-seed");
    expect(result).toEqual({ battle, encounter: expect.objectContaining({ battleIndex: 1 }), resumed: false });
  });

  it("cierra como derrota un combate jugable abandonado en vez de reemitirlo", async () => {
    const repository = {
      getActiveRun: vi.fn().mockResolvedValue(run),
      getIssuedBattle: vi.fn().mockResolvedValue(battle),
      getCombatSession: vi.fn().mockResolvedValue({
        session: {
          protocolVersion: COMBAT_PROOF_PROTOCOL_VERSION,
          expiresAtIso: "2026-08-01T00:00:00Z",
        },
        snapshot: {
          playerA: { hand: [{}, {}, {}, {}] },
          playerB: { hand: [{}, {}, {}, {}] },
        } as GameState,
      }),
      forfeitIssuedBattle: vi.fn().mockResolvedValue(run),
      invalidateIssuedBattle: vi.fn(),
      issueBattle: vi.fn(),
    } as unknown as ISurvivalRepository;

    await expect(new IssueSurvivalBattleUseCase(repository, vi.fn()).execute({
      playerId: "player-1", runId: "run-1", battleId: "new", seed: "s",
      expiresAtIso: "2026-08-02T00:00:00Z", nowIso: "2026-08-01T06:00:00Z",
    })).rejects.toThrow("abandonar");

    expect(repository.forfeitIssuedBattle).toHaveBeenCalledWith("player-1", "battle-1");
    expect(repository.invalidateIssuedBattle).not.toHaveBeenCalled();
    expect(repository.issueBattle).not.toHaveBeenCalled();
  });

  it("persiste rival y tier derivados del ruleset", async () => {
    const snapshot = {
      playerA: { id: "player-1" },
      playerB: { id: "opponent-1" },
    } as GameState;
    const repository = {
      getActiveRun: vi.fn().mockResolvedValue(run),
      getIssuedBattle: vi.fn().mockResolvedValue(null),
      getRuleset: vi.fn().mockResolvedValue(configuration),
      issueBattle: vi.fn().mockResolvedValue(battle),
    } as unknown as ISurvivalRepository;
    const useCase = new IssueSurvivalBattleUseCase(
      repository,
      vi.fn().mockResolvedValue({ snapshot, snapshotHash: "hash" }),
    );
    await useCase.execute({ playerId: "player-1", runId: "run-1", battleId: "battle-1", seed: "s", expiresAtIso: "2026-08-01T00:00:00Z" });
    expect(repository.issueBattle).toHaveBeenCalledWith(expect.objectContaining({
      opponentId: "opponent-1", effectiveTier: 4, ascensionRank: 0, snapshotHash: "hash",
    }));
  });
});
