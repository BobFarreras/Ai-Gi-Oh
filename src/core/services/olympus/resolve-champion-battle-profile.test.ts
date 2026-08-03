// src/core/services/olympus/resolve-champion-battle-profile.test.ts - Verifica acumulación por rango, caps y aislamiento entre campeones.
import { describe, expect, it } from "vitest";
import { IOlympusChampion, IOlympusUpgradeNode } from "@/core/entities/olympus/IOlympus";
import { getMaxCardLevel, getTotalXpRequiredToReachLevel } from "@/core/services/progression/card-level-rules";
import { resolveChampionBattleProfile } from "./resolve-champion-battle-profile";

const champion: IOlympusChampion = {
  id: "gennvim",
  arenaOpponentId: "training-tier-1",
  requiredTier: 1,
  requiredLadderPosition: 1,
  baseDeckVariantId: "starter-tools",
  baseScale: { level: 14, versionTier: 2, startingLp: 8000 },
  version: 1,
};

function node(overrides: Partial<IOlympusUpgradeNode>): IOlympusUpgradeNode {
  return {
    id: "gennvim-power-1",
    championId: "gennvim",
    branch: "POWER",
    prerequisiteNodeIds: [],
    effect: { kind: "GLOBAL_LEVEL", amount: 5, cap: 100 },
    fragmentCost: 40,
    maxRank: 16,
    sortOrder: 10,
    ...overrides,
  };
}

describe("resolveChampionBattleProfile", () => {
  it("devuelve la escala base cuando no hay rangos comprados", () => {
    expect(resolveChampionBattleProfile(champion, [node({})], {})).toMatchObject({
      level: 14,
      versionTier: 2,
      startingLp: 8000,
      energyBonus: 0,
    });
  });

  it("acumula el efecto una vez por rango: es lo que hace del árbol una progresión", () => {
    const nodes = [node({ id: "power" })];
    expect(resolveChampionBattleProfile(champion, nodes, { power: 1 }).level).toBe(19);
    expect(resolveChampionBattleProfile(champion, nodes, { power: 4 }).level).toBe(34);
    expect(resolveChampionBattleProfile(champion, nodes, { power: 16 }).level).toBe(94);
  });

  it("no deja pasar más rangos de los que el nodo permite", () => {
    const nodes = [node({ id: "power", maxRank: 2 })];
    // Un `node_ranks` manipulado no puede superar el tope declarado del nodo.
    expect(resolveChampionBattleProfile(champion, nodes, { power: 99 }).level).toBe(24);
  });

  it("respeta el cap del atributo aunque queden rangos por comprar", () => {
    const nodes = [node({ id: "power", effect: { kind: "GLOBAL_LEVEL", amount: 5, cap: 30 }, maxRank: 16 })];
    expect(resolveChampionBattleProfile(champion, nodes, { power: 16 }).level).toBe(30);
  });

  it("suma LP y energía por rango sin pasar de sus topes", () => {
    const nodes = [
      node({ id: "lp", effect: { kind: "STARTING_LP", amount: 500, cap: 12000 }, maxRank: 8 }),
      node({ id: "energy", effect: { kind: "STARTING_ENERGY", amount: 1, cap: 3 }, maxRank: 3 }),
    ];
    expect(resolveChampionBattleProfile(champion, nodes, { lp: 8, energy: 3 })).toMatchObject({
      startingLp: 12000,
      energyBonus: 3,
    });
  });

  it("las cartas emblemáticas suben además del nivel global", () => {
    const nodes = [
      node({ id: "global", effect: { kind: "GLOBAL_LEVEL", amount: 5, cap: 100 } }),
      node({
        id: "identity",
        branch: "IDENTITY",
        effect: { kind: "SIGNATURE_CARD_LEVEL", amount: 5, cap: 100, cardIds: ["entity-claude"] },
      }),
    ];
    const profile = resolveChampionBattleProfile(champion, nodes, { global: 1, identity: 1 });
    expect(profile.level).toBe(19);
    expect(profile.signatureLevel).toBe(24);
    expect(profile.signatureCardIds).toEqual(["entity-claude"]);
  });

  it("ignora los nodos de otro campeón aunque figuren con rango", () => {
    const nodes = [node({ id: "ajeno", championId: "guill" })];
    expect(resolveChampionBattleProfile(champion, nodes, { ajeno: 5 }).level).toBe(14);
  });

  it("deriva la experiencia real acumulada del nivel resuelto", () => {
    const nodes = [node({ id: "max", effect: { kind: "GLOBAL_LEVEL", amount: 30, cap: 100 }, maxRank: 10 })];
    const profile = resolveChampionBattleProfile(champion, nodes, { max: 10 });
    expect(profile).toMatchObject({
      level: getMaxCardLevel(),
      xp: getTotalXpRequiredToReachLevel(getMaxCardLevel()),
    });
  });
});
