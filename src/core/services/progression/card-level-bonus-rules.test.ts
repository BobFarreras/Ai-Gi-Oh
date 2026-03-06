// src/core/services/progression/card-level-bonus-rules.test.ts - Pruebas de bonus de nivel por tipo de carta.
import { describe, expect, it } from "vitest";
import { resolveCardLevelBonuses } from "./card-level-bonus-rules";

describe("card-level-bonus-rules", () => {
  it("aplica bonus ATK/DEF en ENTITY según hitos de nivel", () => {
    expect(resolveCardLevelBonuses("ENTITY", 4)).toEqual({ attackBonus: 0, defenseBonus: 0, energyCostReduction: 0 });
    expect(resolveCardLevelBonuses("ENTITY", 5)).toEqual({ attackBonus: 100, defenseBonus: 0, energyCostReduction: 0 });
    expect(resolveCardLevelBonuses("ENTITY", 20)).toEqual({ attackBonus: 300, defenseBonus: 300, energyCostReduction: 0 });
  });

  it("en no-ENTITY solo aplica reducción de energía al 30", () => {
    expect(resolveCardLevelBonuses("TRAP", 20)).toEqual({ attackBonus: 0, defenseBonus: 0, energyCostReduction: 0 });
    expect(resolveCardLevelBonuses("FUSION", 30)).toEqual({ attackBonus: 0, defenseBonus: 0, energyCostReduction: 1 });
    expect(resolveCardLevelBonuses("EXECUTION", 30)).toEqual({ attackBonus: 0, defenseBonus: 0, energyCostReduction: 1 });
  });
});

