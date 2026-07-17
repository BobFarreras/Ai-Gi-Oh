// src/core/services/opponent/difficulty/types.ts - Descripción breve del módulo.
export type OpponentDifficulty = "EASY" | "NORMAL" | "HARD" | "BOSS" | "MASTER" | "MYTHIC";

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
 * Jugadas AVANZADAS habilitadas por tier (ficha 5: gating de comportamiento escalonado). Las jugadas
 * BÁSICAS —no regalar entities, replegar a defensa, invocar en defensa si se pierde el intercambio— las
 * hacen TODOS los perfiles y NO están aquí. Aquí solo lo que distingue a un experto: reconocer combos,
 * planificar fusiones y cebar trampas reactivas. Así subir de dificultad se nota de verdad.
 */
export interface IOpponentSkillSet {
  /** Reconoce sinergias de combo (Escudo TypeScript ligado, magia de atacar-en-defensa). HARD+. */
  combos: boolean;
  /** Planifica proactivamente montar/conservar materiales para una fusión. BOSS+. */
  fusionPlanning: boolean;
  /** Retrasa invocar para cebar una trampa reactiva de ataque-directo (Flutter Enjambre). MASTER+. */
  baitReactiveTrap: boolean;
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
  /** Jugadas avanzadas habilitadas en este tier (gating escalonado; ficha 5). */
  skill: IOpponentSkillSet;
}

