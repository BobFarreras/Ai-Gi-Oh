// src/components/hub/academy/training/modes/arena/internal/resolve-training-result-action.ts - Decide la acción sugerida tras cerrar un combate de training.
import { ACADEMY_TRAINING_ARENA_ROUTE } from "@/core/constants/routes/academy-routes";

interface IResolveTrainingResultActionInput {
  selectedTier: number;
  newlyUnlockedTiers: number[];
}

export interface ITrainingResultAction {
  label: string;
  href: string;
}

function resolveNextTier(selectedTier: number, newlyUnlockedTiers: number[]): number | null {
  const nextTier = [...newlyUnlockedTiers].sort((left, right) => left - right).find((tier) => tier > selectedTier);
  return nextTier ?? null;
}

/**
 * Devuelve CTA de cierre priorizando el siguiente tier cuando acaba de desbloquearse.
 */
export function resolveTrainingResultAction(input: IResolveTrainingResultActionInput): ITrainingResultAction {
  const nextTier = resolveNextTier(input.selectedTier, input.newlyUnlockedTiers);
  if (!nextTier) return { label: "Volver a selección", href: `${ACADEMY_TRAINING_ARENA_ROUTE}?tier=${input.selectedTier}` };
  return {
    label: `Jugar Nivel ${nextTier}`,
    href: `${ACADEMY_TRAINING_ARENA_ROUTE}?tier=${nextTier}`,
  };
}
