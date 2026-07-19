// src/components/hub/progression/skill-tree/resolve-skill-tree-layout.ts - Coloca los nodos del árbol en el
// lienzo de la constelación (ficha 8). Dos modos: "full" (las 3 ramas, para desktop) y "branch" (una sola rama
// + raíz, centrada en columna, para móvil con selector). Puro y determinista → testeable.
import { ISkillTreeNodeView } from "@/core/services/progression/skill-tree/resolve-skill-tree-view";

export interface INodePosition {
  x: number;
  y: number;
}

export type SkillTreeLayoutMode = "full" | "branch";

export const SKILL_TREE_VIEWBOX = { width: 1000, height: 660 };
export const SKILL_TREE_BRANCH_VIEWBOX = { width: 460, height: 640 };

export function skillTreeViewBox(mode: SkillTreeLayoutMode): { width: number; height: number } {
  return mode === "branch" ? SKILL_TREE_BRANCH_VIEWBOX : SKILL_TREE_VIEWBOX;
}

const FULL = {
  branchX: { ROOT: 500, COMBAT: 210, ARSENAL: 500, ECONOMY: 790 } as Record<string, number>,
  baseY: 590,
  rowHeight: 124,
  siblingGap: 128,
};
const BRANCH = { centerX: 230, baseY: 560, rowHeight: 120, siblingGap: 118 };

export function resolveSkillTreeLayout(
  nodes: readonly ISkillTreeNodeView[],
  mode: SkillTreeLayoutMode = "full",
): Map<string, INodePosition> {
  const byBranchTier = new Map<string, ISkillTreeNodeView[]>();
  for (const view of nodes) {
    const key = `${view.node.branch}:${view.node.tier}`;
    const group = byBranchTier.get(key);
    if (group) group.push(view);
    else byBranchTier.set(key, [view]);
  }

  const positions = new Map<string, INodePosition>();
  for (const [key, group] of byBranchTier) {
    const [branch, tierText] = key.split(":");
    const tier = Number(tierText);
    const centerX = mode === "branch" ? BRANCH.centerX : FULL.branchX[branch] ?? FULL.branchX.ARSENAL;
    const baseY = mode === "branch" ? BRANCH.baseY : FULL.baseY;
    const rowHeight = mode === "branch" ? BRANCH.rowHeight : FULL.rowHeight;
    const siblingGap = mode === "branch" ? BRANCH.siblingGap : FULL.siblingGap;
    const y = baseY - tier * rowHeight;
    group.forEach((view, index) => {
      const offset = (index - (group.length - 1) / 2) * siblingGap;
      positions.set(view.node.id, { x: centerX + offset, y });
    });
  }
  return positions;
}
