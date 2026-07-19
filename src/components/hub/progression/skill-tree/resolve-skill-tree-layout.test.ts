// src/components/hub/progression/skill-tree/resolve-skill-tree-layout.test.ts - Verifica el auto-layout de la
// constelación (raíz abajo-centro, ramas por columna, tiers por fila).
import { describe, expect, it } from "vitest";
import { ISkillTreeNode } from "@/core/entities/progression/ISkillTreeNode";
import { ISkillTreeNodeView } from "@/core/services/progression/skill-tree/resolve-skill-tree-view";
import { SKILL_TREE_VIEWBOX, resolveSkillTreeLayout } from "./resolve-skill-tree-layout";

function view(id: string, branch: ISkillTreeNode["branch"], tier: number): ISkillTreeNodeView {
  return {
    node: { id, branch, tier, maxRank: 5, costPerRank: 1, effect: { kind: "STARTING_LP_BONUS", valuePerRank: 100 }, prerequisites: [], display: { name: id, blurb: "" } },
    rank: 0, isMaxed: false, prerequisitesMet: true, nextCost: 1, isUnlockable: true,
  };
}

describe("resolveSkillTreeLayout", () => {
  it("coloca la raíz abajo-centro", () => {
    const pos = resolveSkillTreeLayout([view("root", "ROOT", 0)]);
    const root = pos.get("root")!;
    expect(root.x).toBe(500);
    expect(root.y).toBe(590);
  });

  it("los tiers más altos suben (menor y) y las ramas van a columnas distintas", () => {
    const pos = resolveSkillTreeLayout([view("eco", "ECONOMY", 2), view("cbt", "COMBAT", 1)]);
    expect(pos.get("eco")!.y).toBeLessThan(pos.get("cbt")!.y); // tier 2 más arriba que tier 1
    expect(pos.get("eco")!.x).toBeGreaterThan(pos.get("cbt")!.x); // economía a la derecha, combate a la izquierda
  });

  it("reparte horizontalmente los nodos hermanos del mismo tier/rama", () => {
    const pos = resolveSkillTreeLayout([
      view("a", "ECONOMY", 1), view("b", "ECONOMY", 1), view("c", "ECONOMY", 1),
    ]);
    const xs = ["a", "b", "c"].map((id) => pos.get(id)!.x);
    expect(new Set(xs).size).toBe(3); // no se solapan
    expect(xs.every((x) => x > 0 && x < SKILL_TREE_VIEWBOX.width)).toBe(true);
  });
});
