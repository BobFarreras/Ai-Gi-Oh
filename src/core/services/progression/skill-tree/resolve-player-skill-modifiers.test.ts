// src/core/services/progression/skill-tree/resolve-player-skill-modifiers.test.ts - Verifica la agregación de
// efectos del árbol de habilidades (ficha 8): escalado por rango, keystones, familias separadas.
import { describe, expect, it } from "vitest";
import { resolvePlayerSkillModifiers } from "./resolve-player-skill-modifiers";
import { IPlayerSkillNodeState, SkillEffect } from "./skill-effect-types";

function node(effect: SkillEffect, rank: number): IPlayerSkillNodeState {
  return { effect, rank };
}

describe("resolvePlayerSkillModifiers", () => {
  it("sin nodos → todos los modificadores en cero/false", () => {
    const mods = resolvePlayerSkillModifiers([]);
    expect(mods.economy.nexusRewardMult).toBe(0);
    expect(mods.combat.startingLpBonus).toBe(0);
    expect(mods.permissions.secondDeckSlot).toBe(false);
  });

  it("escalable multiplica por el rango (Blindaje Nv.3 = +300 LP)", () => {
    const mods = resolvePlayerSkillModifiers([node({ kind: "STARTING_LP_BONUS", valuePerRank: 100 }, 3)]);
    expect(mods.combat.startingLpBonus).toBe(300);
  });

  it("acumula el mismo tipo de dos nodos distintos (Aprendizaje Nv.5 + Veterano Nv.5 = +20% XP)", () => {
    const mods = resolvePlayerSkillModifiers([
      node({ kind: "XP_REWARD_MULT", valuePerRank: 0.02 }, 5),
      node({ kind: "XP_REWARD_MULT", valuePerRank: 0.02 }, 5),
    ]);
    expect(mods.economy.xpRewardMult).toBeCloseTo(0.2, 10);
  });

  it("Socio Mayoritario Nv.4 (×3): +2.0 de multiplicador de Nexus", () => {
    const mods = resolvePlayerSkillModifiers([node({ kind: "NEXUS_REWARD_MULT", valuePerRank: 0.5 }, 4)]);
    expect(mods.economy.nexusRewardMult).toBeCloseTo(2, 10);
  });

  it("Núcleo Sobrecargado Nv.2 = techo de energía +2 (10 → 12)", () => {
    const mods = resolvePlayerSkillModifiers([node({ kind: "MAX_ENERGY_BONUS", valuePerRank: 1 }, 2)]);
    expect(mods.combat.maxEnergyBonus).toBe(2);
  });

  it("PASSIVE_NEXUS_CAP_BONUS escala per-win y diario por separado", () => {
    const mods = resolvePlayerSkillModifiers([node({ kind: "PASSIVE_NEXUS_CAP_BONUS", perWinPerRank: 25, dailyPerRank: 200 }, 3)]);
    expect(mods.economy.passiveNexusPerWinBonus).toBe(75);
    expect(mods.economy.passiveNexusDailyBonus).toBe(600);
  });

  it("keystones booleanos y de permiso se activan con rango 1", () => {
    const mods = resolvePlayerSkillModifiers([
      node({ kind: "FIRST_WIN_DOUBLE_NEXUS" }, 1),
      node({ kind: "OPENING_MULLIGAN" }, 1),
      node({ kind: "UNLOCK_SECOND_DECK" }, 1),
      node({ kind: "OPENING_HAND_BONUS", value: 1 }, 1),
      node({ kind: "EDIT_OPENING_DECK", count: 5 }, 1),
      node({ kind: "GRANT_RESPEC_TOKEN", value: 1 }, 1),
    ]);
    expect(mods.economy.firstWinDoubleNexus).toBe(true);
    expect(mods.combat.openingMulligan).toBe(true);
    expect(mods.combat.openingHandBonus).toBe(1);
    expect(mods.combat.editOpeningDeckCount).toBe(5);
    expect(mods.permissions.secondDeckSlot).toBe(true);
    expect(mods.permissions.respecTokens).toBe(1);
  });

  it("ignora nodos con rango inválido (0, negativo, NaN)", () => {
    const mods = resolvePlayerSkillModifiers([
      node({ kind: "STARTING_LP_BONUS", valuePerRank: 100 }, 0),
      node({ kind: "STARTING_LP_BONUS", valuePerRank: 100 }, -2),
      node({ kind: "STARTING_LP_BONUS", valuePerRank: 100 }, Number.NaN),
    ]);
    expect(mods.combat.startingLpBonus).toBe(0);
  });

  it("separa las tres familias en un build mixto", () => {
    const mods = resolvePlayerSkillModifiers([
      node({ kind: "NEXUS_REWARD_MULT", valuePerRank: 0.02 }, 5),
      node({ kind: "STARTING_LP_BONUS", valuePerRank: 100 }, 5),
      node({ kind: "UNLOCK_SECOND_DECK" }, 1),
    ]);
    expect(mods.economy.nexusRewardMult).toBeCloseTo(0.1, 10);
    expect(mods.combat.startingLpBonus).toBe(500);
    expect(mods.permissions.secondDeckSlot).toBe(true);
  });
});
