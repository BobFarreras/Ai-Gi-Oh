// src/core/services/survival/resolve-survival-encounter.test.ts - Protege escalado, rotación y Ascensión.
import { describe, expect, it } from "vitest";
import { ISurvivalRuleset, ISurvivalScalingStage } from "@/core/entities/survival/ISurvival";
import { resolveSurvivalEncounter } from "./resolve-survival-encounter";

const ruleset: ISurvivalRuleset = {
  id: "ruleset-1", version: 1, startTier: 4, battlesPerTier: 2,
  roster: ["a", "b", "c"], milestoneInterval: 5, milestoneHeal: 2000,
};
const stages: ISurvivalScalingStage[] = [
  { fromBattle: 1, aiProfile: "HARD", maxTier: 5, maxLpBonus: 0, statBonusPerRank: 0, rewardDefinitionId: "base" },
  { fromBattle: 5, aiProfile: "BOSS", maxTier: 8, maxLpBonus: 500, statBonusPerRank: 150, rewardDefinitionId: "boss" },
];

describe("resolveSurvivalEncounter", () => {
  it("empieza en tier 4 y avanza cada dos combates", () => {
    expect(resolveSurvivalEncounter(ruleset, stages, 1)).toMatchObject({ effectiveTier: 4, opponentId: "a" });
    expect(resolveSurvivalEncounter(ruleset, stages, 3)).toMatchObject({ effectiveTier: 5, opponentId: "c" });
    expect(resolveSurvivalEncounter(ruleset, stages, 5)).toMatchObject({ effectiveTier: 6, opponentId: "b" });
  });

  it("entra en Ascensión por vueltas completas tras alcanzar el tier máximo", () => {
    expect(resolveSurvivalEncounter(ruleset, stages, 9)).toMatchObject({ effectiveTier: 8, ascensionRank: 0 });
    expect(resolveSurvivalEncounter(ruleset, stages, 12)).toMatchObject({
      effectiveTier: 8, ascensionRank: 1, maxLpBonus: 500, statBonusPerRank: 150,
    });
  });

  it("rechaza índices fuera del contrato", () => {
    expect(() => resolveSurvivalEncounter(ruleset, stages, 0)).toThrow("inválido");
  });
});
