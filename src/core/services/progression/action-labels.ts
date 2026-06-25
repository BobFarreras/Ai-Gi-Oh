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
  EVOLVE_CARD: "Evolucionar una carta",
  SPEND_NEXUS: "Gastar Nexus",
};

/** Devuelve la etiqueta legible de una acción, o la propia clave si no está mapeada. */
export function progressionActionLabel(actionType: string): string {
  return PROGRESSION_ACTION_LABEL[actionType] ?? actionType;
}
