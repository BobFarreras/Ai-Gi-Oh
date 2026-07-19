// src/core/services/progression/skill-tree/skill-effect-types.ts - Tipos del motor de efectos del árbol de
// habilidades (ficha 8). Cada nodo del catálogo lleva un `effect` discriminado por `kind`; el motor/servidor
// NUNCA leen ids de nodo a mano, solo el `kind` y el rango del jugador. Ver docs/features/skill-tree-*.md.

/** Identificadores canónicos de los `kind` de efecto (evita strings mágicos en catálogo, mapper y resolver). */
export const SKILL_EFFECT_KINDS = {
  // — Familia A · ECONOMÍA (servidor, tubería de recompensa) —
  NEXUS_REWARD_MULT: "NEXUS_REWARD_MULT",
  XP_REWARD_MULT: "XP_REWARD_MULT",
  LOSS_CONSOLATION_MULT: "LOSS_CONSOLATION_MULT",
  PASSIVE_NEXUS_CAP_BONUS: "PASSIVE_NEXUS_CAP_BONUS",
  FIRST_WIN_DOUBLE_NEXUS: "FIRST_WIN_DOUBLE_NEXUS",
  // — Familia B · COMBATE (preparación de partida; PvE en v1) —
  STARTING_LP_BONUS: "STARTING_LP_BONUS",
  MAX_ENERGY_BONUS: "MAX_ENERGY_BONUS",
  TURN1_ENERGY_BONUS: "TURN1_ENERGY_BONUS",
  OPENING_HAND_BONUS: "OPENING_HAND_BONUS",
  OPENING_MULLIGAN: "OPENING_MULLIGAN",
  EDIT_OPENING_DECK: "EDIT_OPENING_DECK",
  // — Familia C · PERMISOS (leídos por UIs de feature, no por el combate) —
  UNLOCK_SECOND_DECK: "UNLOCK_SECOND_DECK",
  GRANT_RESPEC_TOKEN: "GRANT_RESPEC_TOKEN",
} as const;

export type SkillEffectKind = (typeof SKILL_EFFECT_KINDS)[keyof typeof SKILL_EFFECT_KINDS];

/**
 * Efecto de un nodo. Los ESCALABLES llevan `valuePerRank` (el resolver hace `valor·rango`); los KEYSTONE
 * (maxRank 1) llevan valor fijo o son booleanos (aportan una vez si el jugador tiene el nodo).
 */
export type SkillEffect =
  // Familia A · Economía
  | { kind: "NEXUS_REWARD_MULT"; valuePerRank: number }
  | { kind: "XP_REWARD_MULT"; valuePerRank: number }
  | { kind: "LOSS_CONSOLATION_MULT"; valuePerRank: number }
  | { kind: "PASSIVE_NEXUS_CAP_BONUS"; perWinPerRank?: number; dailyPerRank?: number }
  | { kind: "FIRST_WIN_DOUBLE_NEXUS" }
  // Familia B · Combate
  | { kind: "STARTING_LP_BONUS"; valuePerRank: number }
  | { kind: "MAX_ENERGY_BONUS"; valuePerRank: number }
  | { kind: "TURN1_ENERGY_BONUS"; value: number }
  | { kind: "OPENING_HAND_BONUS"; value: number }
  | { kind: "OPENING_MULLIGAN" }
  | { kind: "EDIT_OPENING_DECK"; count: number }
  // Familia C · Permisos
  | { kind: "UNLOCK_SECOND_DECK" }
  | { kind: "GRANT_RESPEC_TOKEN"; value: number };

/** Un nodo desbloqueado por el jugador y a qué rango lo tiene (viene de `player_skill_ranks` ⋈ catálogo). */
export interface IPlayerSkillNodeState {
  effect: SkillEffect;
  /** Rango del jugador en este nodo (>= 1; 0 o ausente = no lo tiene → sin efecto). */
  rank: number;
}

/**
 * Modificadores agregados del jugador, separados por familia de enganche. Los valores son sumas CRUDAS
 * (sin redondear): cada consumidor redondea al aplicar (p.ej. `Math.floor` sobre el Nexus final).
 * Convención de multiplicadores: `*RewardMult` es el bonus ADITIVO (0 = nada); el multiplicador final es
 * `1 + mult`.
 */
export interface IPlayerSkillModifiers {
  economy: {
    nexusRewardMult: number;
    xpRewardMult: number;
    lossConsolationMult: number;
    firstWinDoubleNexus: boolean;
    passiveNexusPerWinBonus: number;
    passiveNexusDailyBonus: number;
  };
  combat: {
    startingLpBonus: number;
    maxEnergyBonus: number;
    turn1EnergyBonus: number;
    openingHandBonus: number;
    openingMulligan: boolean;
    editOpeningDeckCount: number;
  };
  permissions: {
    secondDeckSlot: boolean;
    respecTokens: number;
  };
}
