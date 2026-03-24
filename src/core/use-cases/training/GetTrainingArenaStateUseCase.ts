// src/core/use-cases/training/GetTrainingArenaStateUseCase.ts - Resuelve estado de arena training (tiers disponibles y tier efectivo).
import { ITrainingProgress } from "@/core/entities/training/ITrainingProgress";
import { ITrainingTierDefinition } from "@/core/entities/training/ITrainingTierDefinition";
import { resolveTrainingTierAccess } from "@/core/services/training/resolve-training-tier-access";

interface IGetTrainingArenaStateInput {
  progress: ITrainingProgress;
  selectedTier: number;
  catalog: ITrainingTierDefinition[];
}

export interface IGetTrainingArenaStateOutput {
  effectiveTier: number;
  highestUnlockedTier: number;
  tiers: ReturnType<typeof resolveTrainingTierAccess>["tiers"];
}

function clampSelectedTier(selectedTier: number): number {
  if (!Number.isInteger(selectedTier) || selectedTier < 1) return 1;
  return selectedTier;
}

export class GetTrainingArenaStateUseCase {
  /**
   * Garantiza que el tier activo de arena sea válido y desbloqueado.
   */
  execute(input: IGetTrainingArenaStateInput): IGetTrainingArenaStateOutput {
    const access = resolveTrainingTierAccess({ catalog: input.catalog, progress: input.progress });
    const selectedTier = clampSelectedTier(input.selectedTier);
    const tier = access.tiers.find((item) => item.tier === selectedTier);
    const effectiveTier = tier?.isUnlocked ? selectedTier : access.highestUnlockedTier;
    return { effectiveTier, highestUnlockedTier: access.highestUnlockedTier, tiers: access.tiers };
  }
}
