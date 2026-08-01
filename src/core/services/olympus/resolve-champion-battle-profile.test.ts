// src/core/services/olympus/resolve-champion-battle-profile.test.ts - Verifica caps, acumulación y aislamiento entre campeones.
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
    effect: { kind: "GLOBAL_LEVEL", amount: 5, cap: 30 },
    fragmentCost: 40,
    sortOrder: 10,
    ...overrides,
  };
}

describe("resolveChampionBattleProfile", () => {
  it("devuelve la escala base cuando no hay nodos comprados", () => {
    expect(resolveChampionBattleProfile(champion, [node({})], [])).toMatchObject({
      level: 14,
      versionTier: 2,
      startingLp: 8000,
      energyBonus: 0,
    });
  });

  it("acumula nodos de la misma rama y respeta el cap más restrictivo", () => {
    const nodes = [
      node({ id: "a", effect: { kind: "GLOBAL_LEVEL", amount: 10, cap: 30 } }),
      node({ id: "b", effect: { kind: "GLOBAL_LEVEL", amount: 10, cap: 20 } }),
    ];
    expect(resolveChampionBattleProfile(champion, nodes, ["a", "b"]).level).toBe(20);
  });

  it("sube LP y energía iniciales sin pasar de sus topes", () => {
    const nodes = [
      node({ id: "lp", effect: { kind: "STARTING_LP", amount: 5000, cap: 12000 } }),
      node({ id: "energy", effect: { kind: "STARTING_ENERGY", amount: 9, cap: 3 } }),
    ];
    expect(resolveChampionBattleProfile(champion, nodes, ["lp", "energy"])).toMatchObject({
      startingLp: 12000,
      energyBonus: 3,
    });
  });

  it("las cartas emblemáticas suben además del nivel global", () => {
    const nodes = [
      node({ id: "global", effect: { kind: "GLOBAL_LEVEL", amount: 5, cap: 30 } }),
      node({
        id: "identity",
        branch: "IDENTITY",
        effect: { kind: "SIGNATURE_CARD_LEVEL", amount: 5, cap: 30, cardIds: ["entity-claude"] },
      }),
    ];
    const profile = resolveChampionBattleProfile(champion, nodes, ["global", "identity"]);
    expect(profile.level).toBe(19);
    expect(profile.signatureLevel).toBe(24);
    expect(profile.signatureCardIds).toEqual(["entity-claude"]);
  });

  it("ignora los nodos de otro campeón aunque figuren como comprados", () => {
    const nodes = [node({ id: "ajeno", championId: "guill", effect: { kind: "GLOBAL_LEVEL", amount: 10, cap: 30 } })];
    expect(resolveChampionBattleProfile(champion, nodes, ["ajeno"]).level).toBe(14);
  });

  it("deriva la experiencia real acumulada del nivel resuelto", () => {
    const nodes = [node({ id: "max", effect: { kind: "GLOBAL_LEVEL", amount: 30, cap: 30 } })];
    expect(resolveChampionBattleProfile(champion, nodes, ["max"])).toMatchObject({
      level: 30,
      xp: getTotalXpRequiredToReachLevel(30),
    });
  });

  it("permite subir por encima del antiguo tope de 30 hasta el máximo del juego", () => {
    const nodes = [node({ id: "alto", effect: { kind: "GLOBAL_LEVEL", amount: 200, cap: 200 } })];
    expect(resolveChampionBattleProfile(champion, nodes, ["alto"]).level).toBe(getMaxCardLevel());
  });
});
