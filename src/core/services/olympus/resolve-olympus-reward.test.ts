// src/core/services/olympus/resolve-olympus-reward.test.ts - Verifica bonus único de primera victoria y compensación por derrota.
import { describe, expect, it } from "vitest";
import { IOlympusLegend } from "@/core/entities/olympus/IOlympus";
import { resolveOlympusReward } from "./resolve-olympus-reward";

const legend = {
  rewardDefinitionId: "olympus-v1-zeus",
  baseFragmentReward: 150,
  firstVictoryFragmentBonus: 400,
  defeatFragmentReward: 20,
} as IOlympusLegend;

describe("resolveOlympusReward", () => {
  it("paga el bonus solo la primera vez que se vence a la leyenda", () => {
    expect(resolveOlympusReward(legend, "WIN", false)).toMatchObject({
      ascensionFragments: 550,
      firstVictory: true,
    });
    expect(resolveOlympusReward(legend, "WIN", true)).toMatchObject({
      ascensionFragments: 150,
      firstVictory: false,
    });
  });

  it("la derrota y el empate solo dejan la compensación configurada", () => {
    expect(resolveOlympusReward(legend, "LOSS", false).ascensionFragments).toBe(20);
    expect(resolveOlympusReward(legend, "DRAW", false)).toMatchObject({
      ascensionFragments: 20,
      firstVictory: false,
    });
  });
});
