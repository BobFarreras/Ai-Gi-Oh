// src/core/services/progression/skill-tree/resolve-skill-tree-view.ts - Modelo de LECTURA del árbol para la UI
// (ficha 8). Función pura: dado el catálogo activo, los rangos del jugador y su estado de nivel, calcula por
// nodo si está al tope / desbloqueable / con prerequisitos cumplidos, y los totales de puntos. La UI solo pinta.
import { IPlayerSkillRank, ISkillTreeNode } from "@/core/entities/progression/ISkillTreeNode";
import { IPlayerLevelState } from "@/core/services/progression/player-level";

export interface ISkillTreeNodeView {
  node: ISkillTreeNode;
  rank: number;
  isMaxed: boolean;
  /** Todos los prerequisitos por-rango se cumplen. */
  prerequisitesMet: boolean;
  /** Coste del siguiente rango, o null si está al tope. */
  nextCost: number | null;
  /** Se puede subir ya: prereqs cumplidos, no al tope y hay puntos suficientes. */
  isUnlockable: boolean;
}

export interface ISkillTreeView {
  level: number;
  xpIntoLevel: number;
  xpForNext: number;
  pointsTotal: number;
  pointsSpent: number;
  pointsAvailable: number;
  nodes: ISkillTreeNodeView[];
}

export function resolveSkillTreeView(
  activeCatalog: readonly ISkillTreeNode[],
  playerRanks: readonly IPlayerSkillRank[],
  level: IPlayerLevelState,
): ISkillTreeView {
  const rankByNodeId = new Map(playerRanks.map((entry) => [entry.nodeId, entry.rank]));
  const rankOf = (nodeId: string): number => rankByNodeId.get(nodeId) ?? 0;

  const pointsSpent = activeCatalog.reduce((sum, node) => sum + node.costPerRank * rankOf(node.id), 0);
  const pointsTotal = level.totalSkillPoints;
  const pointsAvailable = Math.max(0, pointsTotal - pointsSpent);

  const nodes: ISkillTreeNodeView[] = activeCatalog.map((node) => {
    const rank = rankOf(node.id);
    const isMaxed = rank >= node.maxRank;
    const prerequisitesMet = node.prerequisites.every((prereq) => rankOf(prereq.nodeId) >= prereq.minRank);
    return {
      node,
      rank,
      isMaxed,
      prerequisitesMet,
      nextCost: isMaxed ? null : node.costPerRank,
      isUnlockable: prerequisitesMet && !isMaxed && pointsAvailable >= node.costPerRank,
    };
  });

  return {
    level: level.level,
    xpIntoLevel: level.xpIntoLevel,
    xpForNext: level.xpForNext,
    pointsTotal,
    pointsSpent,
    pointsAvailable,
    nodes,
  };
}
