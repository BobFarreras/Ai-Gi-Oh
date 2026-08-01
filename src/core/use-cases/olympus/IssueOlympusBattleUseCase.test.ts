// src/core/use-cases/olympus/IssueOlympusBattleUseCase.test.ts - Verifica emisión autoritativa, reanudación, abandono e incompatibilidad.
import { describe, expect, it, vi } from "vitest";
import { COMBAT_PROOF_PROTOCOL_VERSION } from "@/core/entities/match";
import { IOlympusRepository } from "@/core/repositories/IOlympusRepository";
import { GameState } from "@/core/use-cases/GameEngine";
import { IssueOlympusBattleUseCase } from "./IssueOlympusBattleUseCase";
import { olympusBattle, olympusCatalog, olympusProgress } from "./internal/olympus-test-doubles";

const playableSnapshot = {
  playerA: { id: "player-1", hand: [{}, {}, {}, {}] },
  playerB: { id: "zeus", hand: [{}, {}, {}, {}] },
} as unknown as GameState;

const prepared = {
  snapshot: playableSnapshot,
  snapshotHash: "hash",
  championSnapshotHash: "champion-hash",
  opponentSnapshotHash: "legend-hash",
};

const command = {
  playerId: "player-1", championId: "gennvim", opponentId: "zeus",
  battleId: "battle-1", seed: "seed-1", nowIso: "2026-07-31T10:00:00.000Z",
};

function repositoryWith(overrides: Partial<IOlympusRepository>): IOlympusRepository {
  return {
    getCatalog: vi.fn().mockResolvedValue(olympusCatalog),
    getIssuedBattle: vi.fn().mockResolvedValue(null),
    getUnlockedChampionIds: vi.fn().mockResolvedValue(["gennvim"]),
    getChampionProgress: vi.fn().mockResolvedValue([olympusProgress]),
    issueBattle: vi.fn().mockResolvedValue(olympusBattle),
    ...overrides,
  } as unknown as IOlympusRepository;
}

describe("IssueOlympusBattleUseCase", () => {
  it("emite la batalla con la caducidad que fija la configuración, no el cliente", async () => {
    const repository = repositoryWith({});
    const result = await new IssueOlympusBattleUseCase(repository, vi.fn().mockResolvedValue(prepared))
      .execute(command);

    expect(repository.issueBattle).toHaveBeenCalledWith(expect.objectContaining({
      championId: "gennvim",
      opponentId: "zeus",
      protocolVersion: COMBAT_PROOF_PROTOCOL_VERSION,
      expiresAtIso: "2026-07-31T10:45:00.000Z",
      championSnapshotHash: "champion-hash",
    }));
    expect(result).toMatchObject({ resumed: false, aiProfile: "MYTHIC" });
  });

  it("rechaza un campeón que el jugador no ha desbloqueado", async () => {
    const repository = repositoryWith({ getUnlockedChampionIds: vi.fn().mockResolvedValue([]) });
    await expect(new IssueOlympusBattleUseCase(repository, vi.fn()).execute(command))
      .rejects.toThrow(/derrotar a ese rival/i);
    expect(repository.issueBattle).not.toHaveBeenCalled();
  });

  it("rechaza una leyenda fuera de catálogo antes de gastar el intento", async () => {
    const repository = repositoryWith({});
    await expect(new IssueOlympusBattleUseCase(repository, vi.fn())
      .execute({ ...command, opponentId: "cronos" })).rejects.toThrow(/leyenda no está disponible/i);
    expect(repository.issueBattle).not.toHaveBeenCalled();
  });

  it("reanuda la batalla pendiente sin construir un snapshot nuevo", async () => {
    const snapshotFactory = vi.fn();
    const repository = repositoryWith({
      getIssuedBattle: vi.fn().mockResolvedValue(olympusBattle),
      getCombatSession: vi.fn().mockResolvedValue({
        session: { protocolVersion: COMBAT_PROOF_PROTOCOL_VERSION, expiresAtIso: "2026-07-31T10:30:00.000Z" },
        snapshot: playableSnapshot,
      }),
    });
    const result = await new IssueOlympusBattleUseCase(repository, snapshotFactory).execute(command);

    expect(result).toMatchObject({ resumed: true, battle: olympusBattle, aiProfile: "MYTHIC" });
    expect(snapshotFactory).not.toHaveBeenCalled();
    expect(repository.issueBattle).not.toHaveBeenCalled();
  });

  it("cierra como derrota un combate jugable abandonado", async () => {
    const repository = repositoryWith({
      getIssuedBattle: vi.fn().mockResolvedValue(olympusBattle),
      getCombatSession: vi.fn().mockResolvedValue({
        session: { protocolVersion: COMBAT_PROOF_PROTOCOL_VERSION, expiresAtIso: "2026-07-31T09:00:00.000Z" },
        snapshot: playableSnapshot,
      }),
      forfeitIssuedBattle: vi.fn().mockResolvedValue(olympusBattle),
      invalidateIssuedBattle: vi.fn(),
    });

    await expect(new IssueOlympusBattleUseCase(repository, vi.fn()).execute(command))
      .rejects.toThrow(/Abandonaste/i);
    expect(repository.forfeitIssuedBattle).toHaveBeenCalledWith("player-1", "battle-1");
    expect(repository.invalidateIssuedBattle).not.toHaveBeenCalled();
  });

  it("reemite sin castigo un snapshot incompatible", async () => {
    const repository = repositoryWith({
      getIssuedBattle: vi.fn().mockResolvedValue(olympusBattle),
      getCombatSession: vi.fn().mockResolvedValue({
        session: { protocolVersion: 2, expiresAtIso: "2026-07-31T10:30:00.000Z" },
        snapshot: playableSnapshot,
      }),
      invalidateIssuedBattle: vi.fn().mockResolvedValue(undefined),
      forfeitIssuedBattle: vi.fn(),
    });

    await new IssueOlympusBattleUseCase(repository, vi.fn().mockResolvedValue(prepared)).execute(command);
    expect(repository.invalidateIssuedBattle).toHaveBeenCalledWith("player-1", "battle-1");
    expect(repository.forfeitIssuedBattle).not.toHaveBeenCalled();
    expect(repository.issueBattle).toHaveBeenCalled();
  });

  it("rechaza un snapshot que no corresponde al combate resuelto", async () => {
    const repository = repositoryWith({});
    const mismatched = { ...prepared, snapshot: { playerA: { id: "otro" }, playerB: { id: "zeus" } } as GameState };
    await expect(new IssueOlympusBattleUseCase(repository, vi.fn().mockResolvedValue(mismatched)).execute(command))
      .rejects.toThrow(/no coincide/i);
    expect(repository.issueBattle).not.toHaveBeenCalled();
  });
});
