// src/core/services/progression/action-labels.ts - Etiquetas legibles de las acciones de progresión (reusadas en el evento y el admin).
export const PROGRESSION_ACTION_LABEL: Record<string, string> = {
  PLAY_DUEL: "Jugar un duelo",
  WIN_DUEL: "Ganar un duelo",
  PLAY_ARENA: "Jugar en la arena",
  WIN_ARENA: "Ganar en la arena",
  PLAY_MP_MATCH: "Jugar multijugador",
  WIN_MP_MATCH: "Ganar en multijugador",
  BUY_CARD: "Comprar una carta",
  BUY_PACK: "Abrir un sobre",
  BUY_ITEM: "Comprar un objeto",
  EVOLVE_CARD: "Evolucionar una carta",
  SPEND_NEXUS: "Gastar Nexus",
  WIN_FLAWLESS_STORY: "Ganar en Story sin perder LP",
  WIN_FLAWLESS_TRAINING: "Ganar en la arena sin perder LP",
  WIN_FLAWLESS_MP: "Ganar en multijugador sin perder LP",
  // Objetivos de colección (estado): el progreso se mide contra la colección, no por acciones.
  OWN_CARDS_AT_LEVEL: "Tener cartas a nivel ≥",
  OWN_CARDS_AT_VERSION: "Tener cartas a versión ≥",
  OWN_CARDS_TOTAL: "Tener cartas en el almacén",
  OWN_DISTINCT_CARDS: "Tener cartas distintas",
  REACH_ARENA_TIER: "Desbloquear nivel de la arena ≥",
};

/** Objetivos de misión disponibles para el admin (acciones + colección). */
export const MISSION_OBJECTIVE_TYPES = [
  "PLAY_DUEL", "WIN_DUEL", "PLAY_ARENA", "WIN_ARENA", "PLAY_MP_MATCH", "WIN_MP_MATCH",
  "WIN_FLAWLESS_STORY", "WIN_FLAWLESS_TRAINING", "WIN_FLAWLESS_MP",
  "BUY_CARD", "BUY_PACK", "BUY_ITEM", "EVOLVE_CARD", "SPEND_NEXUS",
  "OWN_CARDS_AT_LEVEL", "OWN_CARDS_AT_VERSION", "OWN_CARDS_TOTAL", "OWN_DISTINCT_CARDS", "REACH_ARENA_TIER",
] as const;

/** Objetivos de estado que requieren un umbral (objective_param). */
export const OBJECTIVE_TYPES_WITH_PARAM = new Set(["OWN_CARDS_AT_LEVEL", "OWN_CARDS_AT_VERSION", "REACH_ARENA_TIER"]);

/**
 * Objetivos de colección/estado: se evalúan en vivo contra la colección (mission_state_count),
 * no pasan por el bus de acciones. Solo son válidos como MISIONES (con umbral + cantidad),
 * nunca como reglas de puntos por acción (no hay dónde guardar el umbral ni se otorgan por evento).
 */
export const COLLECTION_OBJECTIVE_TYPES = new Set([
  "OWN_CARDS_AT_LEVEL", "OWN_CARDS_AT_VERSION", "OWN_CARDS_TOTAL", "OWN_DISTINCT_CARDS", "REACH_ARENA_TIER",
]);

/**
 * Acciones repetibles que otorgan puntos/avance por cada ocurrencia. Son las válidas como
 * reglas de puntos de evento (incluye las flawless). Excluye los objetivos de colección.
 */
export const ACTION_OBJECTIVE_TYPES = MISSION_OBJECTIVE_TYPES.filter((type) => !COLLECTION_OBJECTIVE_TYPES.has(type));

/** Devuelve la etiqueta legible de una acción, o la propia clave si no está mapeada. */
export function progressionActionLabel(actionType: string): string {
  return PROGRESSION_ACTION_LABEL[actionType] ?? actionType;
}
