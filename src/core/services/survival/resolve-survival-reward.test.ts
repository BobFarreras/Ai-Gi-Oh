// src/core/services/survival/resolve-survival-reward.test.ts - Valida economía incremental y bonus de hito.
import { describe, expect, it } from "vitest";
import { ISurvivalBattle, ISurvivalRuleset } from "@/core/entities/survival/ISurvival";
import { resolveSurvivalReward } from "./resolve-survival-reward";

const ruleset = { milestoneInterval: 5 } as ISurvivalRuleset;
const battle = { battleIndex: 4, effectiveTier: 5, ascensionRank: 0 } as ISurvivalBattle;

describe("resolveSurvivalReward", () => {
  it("no acredita Fragmentos al perder o empatar", () => {
    expect(resolveSurvivalReward(battle, ruleset, "base", "LOSS").ascensionFragments).toBe(0);
    expect(resolveSurvivalReward(battle, ruleset, "base", "DRAW").ascensionFragments).toBe(0);
  });

  it("añade bonus solo en hitos exactos", () => {
    expect(resolveSurvivalReward(battle, ruleset, "base", "WIN").ascensionFragments).toBe(10);
    expect(resolveSurvivalReward({ ...battle, battleIndex: 5 }, ruleset, "base", "WIN")).toMatchObject({
      ascensionFragments: 30,
      milestoneReached: true,
    });
  });
});
