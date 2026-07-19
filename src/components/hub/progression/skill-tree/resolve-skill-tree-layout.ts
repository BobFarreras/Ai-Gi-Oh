// src/components/hub/progression/skill-tree/resolve-skill-tree-layout.ts - Coloca los nodos del árbol en el
// lienzo de la constelación (ficha 8). Auto-layout por rama (columna) y tier (fila): la raíz abajo-centro y las
// ramas creciendo hacia arriba. Puro y determinista → testeable; las posiciones se pueden afinar luego.
import { ISkillTreeNodeView } from "@/core/services/progression/skill-tree/resolve-skill-tree-view";

export interface INodePosition {
  x: number;
  y: number;
}

export const SKILL_TREE_VIEWBOX = { width: 1000, height: 660 };

const BRANCH_X: Record<string, number> = { ROOT: 500, COMBAT: 210, ARSENAL: 500, ECONOMY: 790 };
const BASE_Y = 590; // fila de la raíz (tier 0), abajo
const ROW_HEIGHT = 124; // cada tier sube esta distancia
const SIBLING_GAP = 128; // separación horizontal entre nodos del mismo tier/rama

export function resolveSkillTreeLayout(nodes: readonly ISkillTreeNodeView[]): Map<string, INodePosition> {
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
    const centerX = BRANCH_X[branch] ?? BRANCH_X.ARSENAL;
    const y = BASE_Y - tier * ROW_HEIGHT;
    group.forEach((view, index) => {
      const offset = (index - (group.length - 1) / 2) * SIBLING_GAP;
      positions.set(view.node.id, { x: centerX + offset, y });
    });
  }
  return positions;
}
