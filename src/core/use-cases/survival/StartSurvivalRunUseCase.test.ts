// src/core/use-cases/survival/StartSurvivalRunUseCase.test.ts - Verifica inicio idempotente de expediciones.
import { describe, expect, it, vi } from "vitest";
import { ISurvivalRepository } from "@/core/repositories/ISurvivalRepository";
import { ISurvivalRun } from "@/core/entities/survival/ISurvival";
import { StartSurvivalRunUseCase } from "./StartSurvivalRunUseCase";

const run = { id: "run-1", playerId: "player-1" } as ISurvivalRun;
const progress = { bestWins: 12, ascensionFragments: 90 };

describe("StartSurvivalRunUseCase", () => {
  it("reanuda la run activa sin crear otra", async () => {
    const repository = {
      getActiveRun: vi.fn().mockResolvedValue(run),
      getProgress: vi.fn().mockResolvedValue(progress),
      startRun: vi.fn(),
    } as unknown as ISurvivalRepository;
    const result = await new StartSurvivalRunUseCase(repository).execute("player-1", 8000);
    expect(result).toEqual({ run, progress, resumed: true });
    expect(repository.startRun).not.toHaveBeenCalled();
  });

  it("crea una run con la versión activa", async () => {
    const repository = {
      getActiveRun: vi.fn().mockResolvedValue(null),
      getRuleset: vi.fn().mockResolvedValue({ ruleset: { version: 3 }, stages: [] }),
      startRun: vi.fn().mockResolvedValue(run),
      getProgress: vi.fn().mockResolvedValue(progress),
    } as unknown as ISurvivalRepository;
    await expect(new StartSurvivalRunUseCase(repository).execute("player-1", 8000))
      .resolves.toEqual({ run, progress, resumed: false });
    expect(repository.startRun).toHaveBeenCalledWith("player-1", 8000, 3);
  });
});
