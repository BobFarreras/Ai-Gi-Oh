// src/app/hub/story/chapter/[chapter]/duel/[duelIndex]/story-duel-completion-client.ts - Cliente HTTP para registrar cierre de duelo Story desde la vista de combate.
import { ICard } from "@/core/entities/ICard";
import { StoryDuelOutcome } from "@/services/story/duel-flow/story-duel-outcome";

interface IPostStoryDuelCompletionInput {
  chapter: number;
  duelIndex: number;
  outcome: StoryDuelOutcome;
  completionTicket: string;
  flawless?: boolean;
  /** Recaudación (ficha 3): Nexus contado por el motor en el duelo. El servidor lo topa y acredita. */
  passiveNexusEarned?: number;
  /** Clave de idempotencia del cierre (uuid único por duelo; reintentos la reutilizan). */
  passiveNexusOperationId?: string;
}

export interface IPostStoryDuelCompletionOutput {
  rewardNexus: number;
  rewardPlayerExperience: number;
  rewardCards: ICard[];
  /** Nexus perdido por derrota/abandono (0 si ganaste o no había saldo). */
  penaltyNexus: number;
  /** Nexus de la pasiva Recaudación realmente acreditado por el servidor (tras topes). */
  passiveNexusCredited: number;
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
    penaltyNexus: payload.penaltyNexus ?? 0,
    passiveNexusCredited: payload.passiveNexusCredited ?? 0,
    duelNodeId: payload.duelNodeId ?? "",
    returnNodeId: payload.returnNodeId ?? "story-ch1-player-start",
  };
}
