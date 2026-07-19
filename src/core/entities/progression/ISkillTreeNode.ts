// src/core/entities/progression/ISkillTreeNode.ts - Entidades del árbol de habilidades del Operador (ficha 8):
// el nodo del catálogo, el rango del jugador y el resultado de una subida de rango.
import { SkillEffect } from "@/core/services/progression/skill-tree/skill-effect-types";

export type SkillTreeBranch = "ROOT" | "ECONOMY" | "COMBAT" | "ARSENAL";

/** Prerequisito POR RANGO: el nodo `nodeId` debe estar al menos a `minRank` para abrir el dependiente. */
export interface ISkillNodePrerequisite {
  nodeId: string;
  minRank: number;
}

export interface ISkillNodeDisplay {
  name: string;
  blurb: string;
  icon?: string;
  x?: number;
  y?: number;
}

/** Una fila del catálogo `character_skill_nodes`. */
export interface ISkillTreeNode {
  id: string;
  branch: SkillTreeBranch;
  tier: number;
  maxRank: number;
  costPerRank: number;
  effect: SkillEffect;
  prerequisites: ISkillNodePrerequisite[];
  display: ISkillNodeDisplay;
}

/** El rango que un jugador tiene en un nodo (>= 1; los nodos ausentes están a rango 0). */
export interface IPlayerSkillRank {
  nodeId: string;
  rank: number;
}

/** Resultado de `rank_up_skill_node`. `ok=false` trae `reason`; `duplicate=true` = la operación ya se aplicó. */
export interface IRankUpResult {
  ok: boolean;
  nodeId: string;
  /** Rango resultante si `ok`; el actual si se rechazó. */
  rank: number;
  reason?: "bad_args" | "unknown_node" | "max_rank" | "prereq_unmet" | "insufficient_points";
  duplicate?: boolean;
  pointsSpent?: number;
  pointsAvailable?: number;
}
