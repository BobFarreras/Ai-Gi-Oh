// src/core/use-cases/survival/ResetSurvivalRunUseCase.test.ts - Verifica el reinicio inmediato de expediciones bloqueadas.
import { describe, expect, it, vi } from "vitest";
import { ISurvivalRepository } from "@/core/repositories/ISurvivalRepository";
import { ResetSurvivalRunUseCase } from "./ResetSurvivalRunUseCase";

describe("ResetSurvivalRunUseCase", () => {
  it("liquida el combate pendiente y crea una expedición nueva", async () => {
    const freshRun = { id: "run-2" };
    const repository = {
      getActiveRun: vi.fn().mockResolvedValue({ id: "run-1" }),
      getIssuedBattle: vi.fn().mockResolvedValue({ battleId: "battle-1" }),
      forfeitIssuedBattle: vi.fn().mockResolvedValue({ status: "COMPLETED_DEFEAT" }),
      getRuleset: vi.fn().mockResolvedValue({ ruleset: { version: 4, milestoneInterval: 5, milestoneHeal: 2000 }, stages: [] }),
      startRun: vi.fn().mockResolvedValue(freshRun),
      getProgress: vi.fn().mockResolvedValue({ bestWins: 8, ascensionFragments: 20 }),
    } as unknown as ISurvivalRepository;

    const result = await new ResetSurvivalRunUseCase(repository).execute("player-1", 8000);

    expect(repository.forfeitIssuedBattle).toHaveBeenCalledWith("player-1", "battle-1");
    expect(repository.startRun).toHaveBeenCalledWith("player-1", 8000, 4);
    expect(result.run).toBe(freshRun);
    expect(result.forfeitedPreviousRun).toBe(true);
  });

  it("rechaza una run activa sin batalla para no ocultar inconsistencias", async () => {
    const repository = {
      getActiveRun: vi.fn().mockResolvedValue({ id: "run-1" }),
      getIssuedBattle: vi.fn().mockResolvedValue(null),
      forfeitIssuedBattle: vi.fn(),
    } as unknown as ISurvivalRepository;

    await expect(new ResetSurvivalRunUseCase(repository).execute("player-1", 8000))
      .rejects.toThrow(/no tiene un combate/i);
    expect(repository.forfeitIssuedBattle).not.toHaveBeenCalled();
  });
});
