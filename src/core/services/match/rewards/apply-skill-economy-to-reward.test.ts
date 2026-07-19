// src/core/services/match/rewards/apply-skill-economy-to-reward.test.ts - Verifica los modificadores de
// economía del árbol sobre la recompensa base.
import { describe, expect, it } from "vitest";
import { IPlayerSkillModifiers } from "@/core/services/progression/skill-tree/skill-effect-types";
import { applySkillEconomyToReward } from "./apply-skill-economy-to-reward";

function economy(overrides: Partial<IPlayerSkillModifiers["economy"]> = {}): IPlayerSkillModifiers["economy"] {
  return {
    nexusRewardMult: 0, xpRewardMult: 0, lossConsolationMult: 0, firstWinDoubleNexus: false,
    passiveNexusPerWinBonus: 0, passiveNexusDailyBonus: 0, ...overrides,
  };
}

const base = { nexus: 100, playerExperience: 200 };

describe("applySkillEconomyToReward", () => {
  it("sin modificadores deja la recompensa base intacta", () => {
    expect(applySkillEconomyToReward({ base, economy: economy(), outcome: "WIN" })).toEqual(base);
  });

  it("aplica el multiplicador de Nexus y de XP (y redondea hacia abajo)", () => {
    const reward = applySkillEconomyToReward({ base, economy: economy({ nexusRewardMult: 0.1, xpRewardMult: 0.2 }), outcome: "WIN" });
    expect(reward).toEqual({ nexus: 110, playerExperience: 240 });
  });

  it("la 1ª victoria del día dobla el Nexus, combinado con el multiplicador", () => {
    const reward = applySkillEconomyToReward({
      base, economy: economy({ nexusRewardMult: 0.1, firstWinDoubleNexus: true }), outcome: "WIN", isFirstWinOfDay: true,
    });
    expect(reward.nexus).toBe(220); // 100 * 1.1 * 2
  });

  it("el doble NO se aplica si no es la 1ª victoria del día", () => {
    const reward = applySkillEconomyToReward({ base, economy: economy({ firstWinDoubleNexus: true }), outcome: "WIN", isFirstWinOfDay: false });
    expect(reward.nexus).toBe(100);
  });

  it("el consuelo suaviza SOLO la derrota", () => {
    const lose = applySkillEconomyToReward({ base, economy: economy({ lossConsolationMult: 0.3 }), outcome: "LOSE" });
    expect(lose.nexus).toBe(130);
    const win = applySkillEconomyToReward({ base, economy: economy({ lossConsolationMult: 0.3 }), outcome: "WIN" });
    expect(win.nexus).toBe(100);
  });

  it("la derrota nunca se dobla aunque haya keystone de doble", () => {
    const reward = applySkillEconomyToReward({ base, economy: economy({ firstWinDoubleNexus: true }), outcome: "LOSE", isFirstWinOfDay: true });
    expect(reward.nexus).toBe(100);
  });

  it("un multiplicador negativo (dato corrupto) no reduce la recompensa base", () => {
    const reward = applySkillEconomyToReward({ base, economy: economy({ nexusRewardMult: -0.9, xpRewardMult: -0.9 }), outcome: "WIN" });
    expect(reward).toEqual(base);
  });
});
