// src/services/story/duel-flow/story-post-duel-transition.ts - Resuelve y valida transición visual Story tras cerrar un duelo.
import { StoryDuelOutcome, isStoryDuelOutcome } from "@/services/story/duel-flow/story-duel-outcome";

export interface IStoryPostDuelTransition {
  outcome: StoryDuelOutcome;
  duelNodeId: string;
  returnNodeId: string;
}

/**
 * Lee query params y construye la transición post-duelo si el payload es válido.
 */
export function resolveStoryPostDuelTransitionFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): IStoryPostDuelTransition | null {
  const outcome = searchParams.duelOutcome;
  const duelNodeId = searchParams.duelNodeId;
  const returnNodeId = searchParams.returnNodeId;
  if (!isStoryDuelOutcome(outcome)) return null;
  if (typeof duelNodeId !== "string" || duelNodeId.length === 0) return null;
  if (typeof returnNodeId !== "string" || returnNodeId.length === 0) return null;
  return { outcome, duelNodeId, returnNodeId };
}
