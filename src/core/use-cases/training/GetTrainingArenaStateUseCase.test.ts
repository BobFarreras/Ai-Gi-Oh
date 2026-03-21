// src/core/use-cases/training/GetTrainingArenaStateUseCase.test.ts - Valida resolución de tier jugable en arena según desbloqueos training.
import { describe, expect, it } from "vitest";
import { createInitialTrainingProgress, resolveTrainingTierCatalog } from "@/core/services/training/resolve-training-tier-catalog";
import { GetTrainingArenaStateUseCase } from "./GetTrainingArenaStateUseCase";

describe("GetTrainingArenaStateUseCase", () => {
  it("fuerza tier 1 cuando el seleccionado está bloqueado", () => {
    const useCase = new GetTrainingArenaStateUseCase();
    const output = useCase.execute({
      progress: createInitialTrainingProgress("p1"),
      selectedTier: 4,
      catalog: resolveTrainingTierCatalog(),
    });
    expect(output.effectiveTier).toBe(1);
  });

  it("acepta tier seleccionado cuando está desbloqueado", () => {
    const useCase = new GetTrainingArenaStateUseCase();
    const output = useCase.execute({
      progress: {
        ...createInitialTrainingProgress("p1"),
        tierStats: [{ tier: 1, wins: 2, matches: 2 }],
        highestUnlockedTier: 2,
      },
      selectedTier: 2,
      catalog: resolveTrainingTierCatalog(),
    });
    expect(output.effectiveTier).toBe(2);
  });
});
