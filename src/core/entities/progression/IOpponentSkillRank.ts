// src/core/entities/progression/IOpponentSkillRank.ts - Una habilidad del árbol asignada a un oponente
// (Arena o Story) a un rango concreto. Reutiliza el catálogo character_skill_nodes del jugador.

/** Tipo de oponente al que se asignan habilidades. */
export type OpponentSkillTargetType = "arena" | "story";

/** Un nodo del árbol asignado a un oponente, con su rango. Espejo de una fila de `opponent_skill_ranks`. */
export interface IOpponentSkillRank {
  /** Id del oponente (`arena-opp-*` o el id de oponente de Story). */
  opponentId: string;
  opponentType: OpponentSkillTargetType;
  /** Id del nodo del catálogo (`character_skill_nodes`). */
  nodeId: string;
  /** Rango asignado (>= 1). */
  rank: number;
}
