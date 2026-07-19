// src/core/services/progression/skill-tree/resolve-modifiers-from-catalog.ts - Puente puro entre los datos
// persistidos (catálogo de nodos + rangos del jugador) y los modificadores agregados. Une cada nodo ACTIVO con
// el rango del jugador (0 si no lo tiene) y delega en el resolver. Desactivar un nodo (is_active=false, fuera
// del catálogo activo) apaga su efecto aunque el jugador conserve el rango.
import { IPlayerSkillRank, ISkillTreeNode } from "@/core/entities/progression/ISkillTreeNode";
import { resolvePlayerSkillModifiers } from "./resolve-player-skill-modifiers";
import { IPlayerSkillModifiers } from "./skill-effect-types";

export function resolveModifiersFromCatalog(
  activeCatalog: readonly ISkillTreeNode[],
  playerRanks: readonly IPlayerSkillRank[],
): IPlayerSkillModifiers {
  const rankByNodeId = new Map(playerRanks.map((entry) => [entry.nodeId, entry.rank]));
  const nodeStates = activeCatalog.map((node) => ({ effect: node.effect, rank: rankByNodeId.get(node.id) ?? 0 }));
  return resolvePlayerSkillModifiers(nodeStates);
}
