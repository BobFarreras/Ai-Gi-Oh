// src/core/services/progression/skill-tree/resolve-skill-tree-view.test.ts - Verifica el modelo de lectura del
// árbol (estado por nodo + totales de puntos).
import { describe, expect, it } from "vitest";
import { ISkillTreeNode } from "@/core/entities/progression/ISkillTreeNode";
import { resolvePlayerLevel } from "@/core/services/progression/player-level";
import { resolveSkillTreeView } from "./resolve-skill-tree-view";

function node(id: string, overrides: Partial<ISkillTreeNode> = {}): ISkillTreeNode {
  return {
    id, branch: "COMBAT", tier: 1, maxRank: 5, costPerRank: 1,
    effect: { kind: "STARTING_LP_BONUS", valuePerRank: 100 }, prerequisites: [], display: { name: id, blurb: "" },
    ...overrides,
  };
}

// XP acumulada del nivel 12 (100·11·14 = 15400) → 11 puntos totales.
const level = resolvePlayerLevel(15400);

describe("resolveSkillTreeView", () => {
  it("calcula puntos gastados y disponibles a partir de rangos", () => {
    const catalog = [node("a", { costPerRank: 1 }), node("b", { costPerRank: 2 })];
    const view = resolveSkillTreeView(catalog, [{ nodeId: "a", rank: 3 }, { nodeId: "b", rank: 1 }], level);
    // gastado = 1*3 + 2*1 = 5; total 11 → disponible 6.
    expect(view.pointsSpent).toBe(5);
    expect(view.pointsAvailable).toBe(6);
  });

  it("marca un nodo al tope y sin coste siguiente", () => {
    const view = resolveSkillTreeView([node("a", { maxRank: 3 })], [{ nodeId: "a", rank: 3 }], level);
    expect(view.nodes[0].isMaxed).toBe(true);
    expect(view.nodes[0].nextCost).toBe(null);
    expect(view.nodes[0].isUnlockable).toBe(false);
  });

  it("un nodo con prerequisito por rango NO cumplido no es desbloqueable", () => {
    const catalog = [node("base", { maxRank: 5 }), node("gated", { prerequisites: [{ nodeId: "base", minRank: 5 }] })];
    const view = resolveSkillTreeView(catalog, [{ nodeId: "base", rank: 3 }], level);
    const gated = view.nodes.find((n) => n.node.id === "gated")!;
    expect(gated.prerequisitesMet).toBe(false);
    expect(gated.isUnlockable).toBe(false);
  });

  it("cuando el prerequisito llega al rango pedido, el dependiente se vuelve desbloqueable", () => {
    const catalog = [node("base", { maxRank: 5 }), node("gated", { prerequisites: [{ nodeId: "base", minRank: 5 }] })];
    const view = resolveSkillTreeView(catalog, [{ nodeId: "base", rank: 5 }], level);
    const gated = view.nodes.find((n) => n.node.id === "gated")!;
    expect(gated.prerequisitesMet).toBe(true);
    expect(gated.isUnlockable).toBe(true);
  });

  it("sin puntos disponibles, un nodo con prereqs cumplidos NO es desbloqueable", () => {
    const zero = resolvePlayerLevel(0); // 0 puntos
    const view = resolveSkillTreeView([node("a")], [], zero);
    expect(view.pointsAvailable).toBe(0);
    expect(view.nodes[0].isUnlockable).toBe(false);
  });
});
