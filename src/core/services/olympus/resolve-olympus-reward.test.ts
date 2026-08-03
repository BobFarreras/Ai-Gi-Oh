// src/core/services/olympus/resolve-olympus-reward.test.ts - Verifica bonus único de primera victoria, Nexus, carta de botín y compensación por derrota.
import { describe, expect, it } from "vitest";
import { IOlympusLegend } from "@/core/entities/olympus/IOlympus";
import { resolveOlympusReward } from "./resolve-olympus-reward";

const legend = {
  rewardDefinitionId: "olympus-v1-zeus",
  baseFragmentReward: 150,
  firstVictoryFragmentBonus: 400,
  defeatFragmentReward: 20,
  nexusReward: 300,
  cardRewardId: "fusion-gemgpt",
  cardRewardFirstVictoryOnly: true,
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

  it("acredita el Nexus configurado en cada victoria", () => {
    expect(resolveOlympusReward(legend, "WIN", false).nexus).toBe(300);
    expect(resolveOlympusReward(legend, "WIN", true).nexus).toBe(300);
  });

  it("la carta de botín no se repite si la leyenda la limita a la primera victoria", () => {
    expect(resolveOlympusReward(legend, "WIN", false).cardId).toBe("fusion-gemgpt");
    expect(resolveOlympusReward(legend, "WIN", true).cardId).toBeNull();
  });

  it("una leyenda sin el límite reparte carta en cada victoria", () => {
    const repeatable = { ...legend, cardRewardFirstVictoryOnly: false };
    expect(resolveOlympusReward(repeatable, "WIN", true).cardId).toBe("fusion-gemgpt");
  });

  it("una leyenda sin carta configurada nunca entrega ninguna", () => {
    const cardless = { ...legend, cardRewardId: null };
    expect(resolveOlympusReward(cardless, "WIN", false).cardId).toBeNull();
  });

  it("la derrota y el empate solo dejan la compensación configurada", () => {
    expect(resolveOlympusReward(legend, "LOSS", false).ascensionFragments).toBe(20);
    expect(resolveOlympusReward(legend, "DRAW", false)).toMatchObject({
      ascensionFragments: 20,
      nexus: 0,
      cardId: null,
      firstVictory: false,
    });
  });
});
