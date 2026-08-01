// src/core/use-cases/olympus/CompleteOlympusBattleUseCase.test.ts - Verifica liquidación derivada del replay y bonus de primera victoria.
import { describe, expect, it, vi } from "vitest";
import { COMBAT_PROOF_PROTOCOL_VERSION, ICombatProof } from "@/core/entities/match";
import { IOlympusRepository } from "@/core/repositories/IOlympusRepository";
import { createInitialGameState } from "@/core/use-cases/game-engine/state/create-initial-game-state";
import { CompleteOlympusBattleUseCase } from "./CompleteOlympusBattleUseCase";
import { olympusBattle, olympusCatalog } from "./internal/olympus-test-doubles";

const nowIso = "2026-07-31T10:30:00.000Z";

const session = {
  id: "session-1", battleId: "battle-1", mode: "OLYMPUS" as const,
  playerId: "player-1", opponentId: "zeus", seed: "seed",
  snapshotHash: "hash", protocolVersion: COMBAT_PROOF_PROTOCOL_VERSION,
  issuedAtIso: "2026-07-31T10:00:00.000Z", expiresAtIso: "2026-07-31T11:00:00.000Z",
};

const proof: ICombatProof = {
  sessionId: "session-1", battleId: "battle-1", mode: "OLYMPUS",
  snapshotHash: "hash", protocolVersion: COMBAT_PROOF_PROTOCOL_VERSION, entries: [],
};

function snapshotWith(defeatedLegend: boolean) {
  const snapshot = createInitialGameState({
    playerA: { id: "player-1", name: "GenNvim", deck: [] },
    playerB: { id: "zeus", name: "Zeus", deck: [] },
    starterPlayerId: "player-1",
  });
  if (defeatedLegend) snapshot.playerB = { ...snapshot.playerB, healthPoints: 0 };
  return snapshot;
}

function repositoryWith(overrides: Partial<IOlympusRepository>, defeatedLegend = true): IOlympusRepository {
  return {
    getCatalog: vi.fn().mockResolvedValue(olympusCatalog),
    getCombatSession: vi.fn().mockResolvedValue({
      session, snapshot: snapshotWith(defeatedLegend), journalEntries: [],
    }),
    getBattleById: vi.fn().mockResolvedValue(olympusBattle),
    getDefeatedLegendIds: vi.fn().mockResolvedValue([]),
    getFragmentBalance: vi.fn().mockResolvedValue(550),
    completeBattle: vi.fn().mockResolvedValue({
      ...olympusBattle, status: "COMPLETED", outcome: "WIN",
      reward: { ascensionFragments: 550, definitionId: "olympus-v1-zeus", firstVictory: true },
    }),
    saveJournalCheckpoint: vi.fn().mockResolvedValue(3),
    ...overrides,
  } as unknown as IOlympusRepository;
}

describe("CompleteOlympusBattleUseCase", () => {
  it("paga base más bonus la primera vez que se derriba a la leyenda", async () => {
    const repository = repositoryWith({});
    const result = await new CompleteOlympusBattleUseCase(repository).execute("player-1", proof, nowIso);

    expect(result).toMatchObject({ settled: true, outcome: "WIN", duplicate: false });
    expect(repository.completeBattle).toHaveBeenCalledWith(expect.objectContaining({
      outcome: "WIN", fragmentAmount: 550,
    }));
  });

  it("no repite el bonus contra una leyenda ya vencida", async () => {
    const repository = repositoryWith({ getDefeatedLegendIds: vi.fn().mockResolvedValue(["zeus"]) });
    await new CompleteOlympusBattleUseCase(repository).execute("player-1", proof, nowIso);

    expect(repository.completeBattle).toHaveBeenCalledWith(expect.objectContaining({
      fragmentAmount: 150,
      reward: expect.objectContaining({ firstVictory: false }),
    }));
  });

  it("guarda avance en vez de liquidar cuando el duelo sigue abierto", async () => {
    const repository = repositoryWith({}, false);
    const result = await new CompleteOlympusBattleUseCase(repository).execute("player-1", proof, nowIso);

    expect(result).toEqual({ settled: false, journalLength: 3 });
    expect(repository.completeBattle).not.toHaveBeenCalled();
    expect(repository.saveJournalCheckpoint).toHaveBeenCalledWith("player-1", "battle-1", []);
  });

  it("devuelve la liquidación persistida sin volver a acreditar en un retry", async () => {
    const repository = repositoryWith({
      getBattleById: vi.fn().mockResolvedValue({
        ...olympusBattle, status: "COMPLETED", outcome: "WIN",
        reward: { ascensionFragments: 550, definitionId: "olympus-v1-zeus", firstVictory: true },
      }),
    });
    const result = await new CompleteOlympusBattleUseCase(repository).execute("player-1", proof, nowIso);

    expect(result).toMatchObject({ settled: true, duplicate: true, outcome: "WIN" });
    expect(repository.completeBattle).not.toHaveBeenCalled();
  });

  it("rechaza un diario que contradice el avance ya registrado", async () => {
    const repository = repositoryWith({
      getCombatSession: vi.fn().mockResolvedValue({
        session,
        snapshot: snapshotWith(false),
        journalEntries: [
          { sequence: 1, actorPlayerId: "player-1", action: { type: "NEXT_PHASE", payload: {} } },
        ],
      }),
    });
    const rewritten: ICombatProof = {
      ...proof,
      entries: [{
        sequence: 1,
        actorPlayerId: "player-1",
        action: { type: "CHANGE_ENTITY_MODE", payload: { instanceId: "x", newMode: "ATTACK" } },
      }],
    };

    await expect(new CompleteOlympusBattleUseCase(repository).execute("player-1", rewritten, nowIso))
      .rejects.toThrow("contradice el avance");
  });
});
