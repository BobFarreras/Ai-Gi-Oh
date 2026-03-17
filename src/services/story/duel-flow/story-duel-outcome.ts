// src/services/story/duel-flow/story-duel-outcome.ts - Tipos y utilidades canónicas del resultado de un duelo Story.
export const STORY_DUEL_OUTCOMES = ["WON", "LOST", "ABANDONED"] as const;

export type StoryDuelOutcome = (typeof STORY_DUEL_OUTCOMES)[number];

/**
 * Valida si un valor externo corresponde a un resultado Story soportado.
 */
export function isStoryDuelOutcome(value: unknown): value is StoryDuelOutcome {
  return typeof value === "string" && STORY_DUEL_OUTCOMES.includes(value as StoryDuelOutcome);
}

/**
 * Traduce el resultado Story a bandera booleana usada por repositorios legacy.
 */
export function didWinFromStoryOutcome(outcome: StoryDuelOutcome): boolean {
  return outcome === "WON";
}
