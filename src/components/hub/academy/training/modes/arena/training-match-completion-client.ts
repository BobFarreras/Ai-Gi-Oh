// src/components/hub/academy/training/modes/arena/training-match-completion-client.ts - Cliente HTTP para registrar cierre de combate del modo entrenamiento.
import { IMatchOutcome } from "@/core/entities/match/IMatchOutcome";

interface IPostTrainingMatchCompletionInput {
  battleId: string;
  tier: number;
  outcome: IMatchOutcome;
}

export interface IPostTrainingMatchCompletionOutput {
  applied: boolean;
  reward: {
    nexus: number;
    playerExperience: number;
  };
  highestUnlockedTier: number;
  newlyUnlockedTiers: number[];
}

/**
 * Envía cierre de match training para aplicar recompensas y desbloqueos del tier.
 */
export async function postTrainingMatchCompletion(input: IPostTrainingMatchCompletionInput): Promise<IPostTrainingMatchCompletionOutput> {
  const response = await fetch("/api/training/matches/complete", {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error("No se pudo registrar el resultado de entrenamiento.");
  const payload = (await response.json()) as Partial<IPostTrainingMatchCompletionOutput>;
  return {
    applied: payload.applied ?? false,
    reward: payload.reward ?? { nexus: 0, playerExperience: 0 },
    highestUnlockedTier: payload.highestUnlockedTier ?? 1,
    newlyUnlockedTiers: payload.newlyUnlockedTiers ?? [],
  };
}
