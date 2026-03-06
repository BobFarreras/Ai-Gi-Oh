export type OpponentDifficulty = "EASY" | "NORMAL" | "HARD" | "BOSS";

/**
 * Progreso mínimo de campaña necesario para decidir la dificultad.
 * `chapterIndex` y `duelIndex` permiten mapear la historia, mientras que
 * `victories` sirve como fallback si la estructura narrativa aún no está cerrada.
 */
export interface ICampaignProgress {
  /** Número de capítulo actual (1-based). */
  chapterIndex: number;
  /** Número de duelo dentro del capítulo actual (1-based). */
  duelIndex: number;
  /** Victorias totales acumuladas por el jugador en campaña. */
  victories: number;
}

/**
 * Perfil numérico que controla el comportamiento táctico del oponente.
 * No define reglas del juego; solo pondera decisiones heurísticas.
 */
export interface IOpponentDifficultyProfile {
  /** Clave de dificultad usada para identificar el perfil. */
  key: OpponentDifficulty;
  /** Bonus para priorizar daño directo cuando hay ataque libre. */
  directAttackBias: number;
  /** Bonus adicional cuando una jugada puede cerrar partida (lethal). */
  lethalBias: number;
  /** Recompensa por destruir entidad rival en simulación táctica. */
  destroyReward: number;
  /** Penalización cuando el intercambio destruye al atacante propio. */
  attackerLossPenalty: number;
  /** Multiplicador de aversión al daño recibido por atacar mal. */
  selfDamagePenaltyMultiplier: number;
  /** Multiplicador de prioridad ofensiva en ejecuciones de daño. */
  executionAggroBias: number;
  /** Multiplicador de prioridad de despliegue de entidades. */
  entityTempoBias: number;
  /** Umbral mínimo de score para permitir un ataque. */
  minAttackScore: number;
}
