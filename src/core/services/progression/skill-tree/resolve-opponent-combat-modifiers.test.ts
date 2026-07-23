// src/core/services/progression/skill-tree/resolve-opponent-combat-modifiers.test.ts - Cubre que el resolver de
// oponente agrega solo stats de combate (LP/energía) y descarta economía/permisos/efectos no-stat.
import { describe, expect, it } from "vitest";
import { resolveOpponentCombatModifiers } from "./resolve-opponent-combat-modifiers";
import { IPlayerSkillNodeState } from "./skill-effect-types";

describe("resolveOpponentCombatModifiers", () => {
  it("sin nodos devuelve ceros", () => {
    expect(resolveOpponentCombatModifiers([])).toEqual({ startingLpBonus: 0, maxEnergyBonus: 0, turn1EnergyBonus: 0 });
  });

  it("suma LP y techo de energía por rango, y energía de turno 1 (valor fijo)", () => {
    const nodes: IPlayerSkillNodeState[] = [
      { effect: { kind: "STARTING_LP_BONUS", valuePerRank: 100 }, rank: 3 },
      { effect: { kind: "MAX_ENERGY_BONUS", valuePerRank: 1 }, rank: 2 },
      { effect: { kind: "TURN1_ENERGY_BONUS", value: 1 }, rank: 1 },
    ];
    expect(resolveOpponentCombatModifiers(nodes)).toEqual({ startingLpBonus: 300, maxEnergyBonus: 2, turn1EnergyBonus: 1 });
  });

  it("ignora efectos que no son stats de combate (economía, permisos, mano/rebarajar)", () => {
    const nodes: IPlayerSkillNodeState[] = [
      { effect: { kind: "STARTING_LP_BONUS", valuePerRank: 50 }, rank: 2 },
      { effect: { kind: "NEXUS_REWARD_MULT", valuePerRank: 0.02 }, rank: 5 },
      { effect: { kind: "OPENING_MULLIGAN" }, rank: 1 },
      { effect: { kind: "OPENING_HAND_BONUS", value: 2 }, rank: 1 },
      { effect: { kind: "UNLOCK_SECOND_DECK" }, rank: 1 },
    ];
    expect(resolveOpponentCombatModifiers(nodes)).toEqual({ startingLpBonus: 100, maxEnergyBonus: 0, turn1EnergyBonus: 0 });
  });

  it("descarta rangos inválidos (< 1)", () => {
    const nodes: IPlayerSkillNodeState[] = [{ effect: { kind: "STARTING_LP_BONUS", valuePerRank: 100 }, rank: 0 }];
    expect(resolveOpponentCombatModifiers(nodes).startingLpBonus).toBe(0);
  });
});
