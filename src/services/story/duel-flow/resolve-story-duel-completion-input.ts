// src/services/story/duel-flow/resolve-story-duel-completion-input.ts - Normaliza payload de cierre de duelo Story con compatibilidad retroactiva.
import { StoryDuelOutcome, isStoryDuelOutcome } from "@/services/story/duel-flow/story-duel-outcome";

export interface IStoryDuelCompletionInput {
  chapter: number;
  duelIndex: number;
  outcome: StoryDuelOutcome;
}

interface IRawStoryDuelCompletionPayload {
  chapter?: unknown;
  duelIndex?: unknown;
  outcome?: unknown;
  didWin?: unknown;
}

/**
 * Resuelve un payload externo en un contrato estable para cierre de duelo Story.
 */
export function resolveStoryDuelCompletionInput(
  payload: IRawStoryDuelCompletionPayload,
): IStoryDuelCompletionInput | null {
  if (!Number.isInteger(payload.chapter) || (payload.chapter as number) <= 0) return null;
  if (!Number.isInteger(payload.duelIndex) || (payload.duelIndex as number) <= 0) return null;
  if (isStoryDuelOutcome(payload.outcome)) {
    return {
      chapter: payload.chapter as number,
      duelIndex: payload.duelIndex as number,
      outcome: payload.outcome,
    };
  }
  if (typeof payload.didWin === "boolean") {
    return {
      chapter: payload.chapter as number,
      duelIndex: payload.duelIndex as number,
      outcome: payload.didWin ? "WON" : "LOST",
    };
  }
  return null;
}
