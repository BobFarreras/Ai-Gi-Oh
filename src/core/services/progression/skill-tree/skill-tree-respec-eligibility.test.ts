// src/core/services/progression/skill-tree/skill-tree-respec-eligibility.test.ts - El respec se habilita SOLO si
// el jugador tiene la llave: un nodo con efecto GRANT_RESPEC_TOKEN a rango >= 1.
import { describe, expect, it } from "vitest";
import { ISkillTreeNodeView } from "./resolve-skill-tree-view";
import { canRespecSkillTree } from "./skill-tree-respec-eligibility";

function view(kind: string, rank: number): ISkillTreeNodeView {
  return {
    node: {
      id: `node-${kind}`, branch: "ARSENAL", tier: 2, maxRank: 1, costPerRank: 1,
      effect: { kind, value: 1 } as ISkillTreeNodeView["node"]["effect"], prerequisites: [], display: { name: kind, blurb: "" },
    },
    rank,
    isMaxed: rank >= 1,
    prerequisitesMet: true,
    nextCost: null,
    isUnlockable: false,
  };
}

describe("canRespecSkillTree", () => {
  it("true si tiene un nodo GRANT_RESPEC_TOKEN a rango >= 1", () => {
    expect(canRespecSkillTree([view("STARTING_LP_BONUS", 3), view("GRANT_RESPEC_TOKEN", 1)])).toBe(true);
  });

  it("false si tiene el nodo de la llave pero a rango 0 (no desbloqueado)", () => {
    expect(canRespecSkillTree([view("GRANT_RESPEC_TOKEN", 0)])).toBe(false);
  });

  it("false si no tiene ningún nodo de reasignación", () => {
    expect(canRespecSkillTree([view("STARTING_LP_BONUS", 5), view("NEXUS_REWARD_MULT", 2)])).toBe(false);
  });
});
