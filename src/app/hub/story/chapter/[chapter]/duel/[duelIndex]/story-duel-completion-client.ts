// src/app/hub/story/chapter/[chapter]/duel/[duelIndex]/story-duel-completion-client.ts - Cliente HTTP para registrar cierre de duelo Story desde la vista de combate.
import { ICard } from "@/core/entities/ICard";
import { StoryDuelOutcome } from "@/services/story/duel-flow/story-duel-outcome";

interface IPostStoryDuelCompletionInput {
  chapter: number;
  duelIndex: number;
  outcome: StoryDuelOutcome;
}

export interface IPostStoryDuelCompletionOutput {
  rewardNexus: number;
  rewardPlayerExperience: number;
  rewardCards: ICard[];
  duelNodeId: string;
  returnNodeId: string;
}

/**
 * Registra en backend el resultado final del duelo Story y devuelve resumen de transición.
 */
export async function postStoryDuelCompletion(
  input: IPostStoryDuelCompletionInput,
): Promise<IPostStoryDuelCompletionOutput> {
  const response = await fetch("/api/story/duels/complete", {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error("No se pudo registrar el resultado Story.");
  }
  const payload = (await response.json()) as Partial<IPostStoryDuelCompletionOutput>;
  return {
    rewardNexus: payload.rewardNexus ?? 0,
    rewardPlayerExperience: payload.rewardPlayerExperience ?? 0,
    rewardCards: payload.rewardCards ?? [],
    duelNodeId: payload.duelNodeId ?? "",
    returnNodeId: payload.returnNodeId ?? "story-ch1-player-start",
  };
}
