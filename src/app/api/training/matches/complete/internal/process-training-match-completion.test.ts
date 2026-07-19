// src/app/api/training/matches/complete/internal/process-training-match-completion.test.ts - Valida normalización de payload y ejecución de cierre training.
import { describe, expect, it, vi } from "vitest";
import { CompleteTrainingMatchUseCase } from "@/core/use-cases/training/CompleteTrainingMatchUseCase";
import { processTrainingMatchCompletion } from "./process-training-match-completion";

const executeMock = vi.fn();

vi.mock("@/core/use-cases/training/CompleteTrainingMatchUseCase", () => ({
  CompleteTrainingMatchUseCase: vi.fn(
    class {
      execute = executeMock;
    },
  ),
}));

describe("processTrainingMatchCompletion", () => {
  it("normaliza payload y delega en caso de uso", async () => {
    executeMock.mockResolvedValue({ applied: true, reward: { nexus: 30, playerExperience: 80 }, highestUnlockedTier: 2, newlyUnlockedTiers: [2] });
    const output = await processTrainingMatchCompletion({
      playerId: "p1",
      payload: { battleId: "battle-1", tier: 1, outcome: "WIN" },
      dependencies: {
        claimRepository: { tryReserveMatch: vi.fn() },
        trainingProgressRepository: { getByPlayerId: vi.fn(), upsert: vi.fn() },
        walletRepository: { getWallet: vi.fn(), creditNexus: vi.fn(), debitNexus: vi.fn() },
        playerProgressRepository: { getByPlayerId: vi.fn(), create: vi.fn(), update: vi.fn() },
      },
      nowIso: "2026-03-17T12:00:00.000Z",
    });

    // Sin reporte de Recaudación en el payload, se acredita 0 (y NO se toca la RPC real: claim null).
    expect(output).toEqual({ applied: true, reward: { nexus: 30, playerExperience: 80 }, highestUnlockedTier: 2, newlyUnlockedTiers: [2], passiveNexusCredited: 0 });
    expect(executeMock).toHaveBeenCalledWith({
      playerId: "p1",
      battleId: "battle-1",
      tier: 1,
      outcome: "WIN",
      updatedAtIso: "2026-03-17T12:00:00.000Z",
    });
    expect(CompleteTrainingMatchUseCase).toHaveBeenCalledTimes(1);
  });

  it("acredita la Recaudación con la dependencia inyectada cuando el payload trae el reporte", async () => {
    executeMock.mockResolvedValue({ applied: true, reward: { nexus: 30, playerExperience: 80 }, highestUnlockedTier: 2, newlyUnlockedTiers: [] });
    const creditMock = vi.fn().mockResolvedValue(200);
    const output = await processTrainingMatchCompletion({
      playerId: "p1",
      payload: {
        battleId: "battle-1",
        tier: 1,
        outcome: "LOSE",
        passiveNexusEarned: 200,
        passiveNexusOperationId: "3f2c1a10-9b8d-4e5f-a6b7-c8d9e0f1a2b3",
      },
      dependencies: {
        claimRepository: { tryReserveMatch: vi.fn() },
        trainingProgressRepository: { getByPlayerId: vi.fn(), upsert: vi.fn() },
        walletRepository: { getWallet: vi.fn(), creditNexus: vi.fn(), debitNexus: vi.fn() },
        playerProgressRepository: { getByPlayerId: vi.fn(), create: vi.fn(), update: vi.fn() },
        creditPassiveNexus: creditMock,
      },
      nowIso: "2026-03-17T12:00:00.000Z",
    });

    // La derrota también paga (el duelo terminó): la Arena cierra siempre con WIN/LOSE/DRAW.
    expect(output.passiveNexusCredited).toBe(200);
    expect(creditMock).toHaveBeenCalledWith("p1", { earned: 200, operationId: "3f2c1a10-9b8d-4e5f-a6b7-c8d9e0f1a2b3" });
  });
});
