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
      tierStats: [{ tier: 1, wins: 8, matches: 9 }],
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
    expect(tier2?.missingWins).toBe(7);
  });

  it("suelo monótono: no re-bloquea un tier ya desbloqueado aunque no cumpla el nuevo requisito", () => {
    const catalog = resolveTrainingTierCatalog();
    // Jugador que desbloqueó el tier 6 con las reglas antiguas (6 victorias) y NO vuelve a jugar:
    // su highestUnlockedTier persistido (6) actúa de suelo y protege el acceso pese al nuevo requisito (7).
    const progress = {
      ...createInitialTrainingProgress("player-a"),
      highestUnlockedTier: 6,
      tierStats: [{ tier: 5, wins: 6, matches: 6 }],
    };
    const access = resolveTrainingTierAccess({ catalog, progress });

    const tier6 = access.tiers.find((item) => item.tier === 6);
    expect(tier6?.isUnlocked).toBe(true);
    expect(access.highestUnlockedTier).toBe(6);
  });
});
