// src/core/services/training/resolve-training-tier-access.test.ts - Verifica reglas de desbloqueo progresivo por victorias en tier anterior.
import { describe, expect, it } from "vitest";
import { resolveTrainingTierAccess } from "./resolve-training-tier-access";
import { createInitialTrainingProgress, resolveTrainingTierCatalog } from "./resolve-training-tier-catalog";

describe("resolveTrainingTierAccess", () => {
  it("desbloquea solo tier 1 para progreso nuevo", () => {
    const catalog = resolveTrainingTierCatalog();
    const progress = createInitialTrainingProgress("player-a");
    const access = resolveTrainingTierAccess({ catalog, progress });

    expect(access.highestUnlockedTier).toBe(1);
    expect(access.tiers.filter((item) => item.isUnlocked).map((item) => item.tier)).toEqual([1]);
  });

  it("desbloquea siguiente tier al cumplir victorias requeridas", () => {
    const catalog = resolveTrainingTierCatalog();
    const progress = {
      ...createInitialTrainingProgress("player-a"),
      tierStats: [{ tier: 1, wins: 2, matches: 3 }],
    };
    const access = resolveTrainingTierAccess({ catalog, progress });

    const tier2 = access.tiers.find((item) => item.tier === 2);
    expect(tier2?.isUnlocked).toBe(true);
    expect(access.highestUnlockedTier).toBe(2);
  });

  it("mantiene bloqueo si no se cumple requisito de victorias", () => {
    const catalog = resolveTrainingTierCatalog();
    const progress = {
      ...createInitialTrainingProgress("player-a"),
      tierStats: [{ tier: 1, wins: 1, matches: 4 }],
    };
    const access = resolveTrainingTierAccess({ catalog, progress });

    const tier2 = access.tiers.find((item) => item.tier === 2);
    expect(tier2?.isUnlocked).toBe(false);
    expect(tier2?.missingWins).toBe(1);
  });
});
