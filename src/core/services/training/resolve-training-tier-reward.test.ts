// src/core/services/training/resolve-training-tier-reward.test.ts - Verifica el escalado de recompensas de training por tier.
import { describe, expect, it } from "vitest";
import { resolveTrainingTierReward } from "./resolve-training-tier-reward";

describe("resolveTrainingTierReward", () => {
  it("escala recompensa de victoria con multiplicador", () => {
    const reward = resolveTrainingTierReward("WIN", 1.4);
    expect(reward).toEqual({ nexus: 42, playerExperience: 112 });
  });

  it("escala recompensa de derrota para mantener progresión", () => {
    const reward = resolveTrainingTierReward("LOSE", 1.2);
    expect(reward).toEqual({ nexus: 18, playerExperience: 48 });
  });

  it("mantiene recompensa de empate según política base", () => {
    const reward = resolveTrainingTierReward("DRAW", 1.2);
    expect(reward).toEqual({ nexus: 19, playerExperience: 54 });
  });
});
