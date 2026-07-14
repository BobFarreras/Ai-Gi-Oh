// src/core/services/training/resolve-training-tier-access.ts - Calcula acceso a tiers según victorias por tramo anterior.
import { ITrainingProgress } from "@/core/entities/training/ITrainingProgress";
import { ITrainingTierDefinition } from "@/core/entities/training/ITrainingTierDefinition";

interface IResolveTrainingTierAccessInput {
  catalog: ITrainingTierDefinition[];
  progress: ITrainingProgress;
}

export interface ITrainingTierAccessItem extends ITrainingTierDefinition {
  isUnlocked: boolean;
  winsInPreviousTier: number;
  missingWins: number;
}

export interface ITrainingTierAccessState {
  highestUnlockedTier: number;
  tiers: ITrainingTierAccessItem[];
}

function readTierWins(progress: ITrainingProgress, tier: number): number {
  return progress.tierStats.find((item) => item.tier === tier)?.wins ?? 0;
}

/**
 * Resuelve qué tiers se pueden jugar sin depender de UI ni de infraestructura.
 *
 * Suelo monótono: un tier ya desbloqueado (por debajo del `highestUnlockedTier` persistido) NUNCA se
 * re-bloquea, aunque después suba `requiredWinsInPreviousTier` (rebalanceo de la escalera). Así ampliar
 * el roster/requisitos no le quita a nadie el progreso conseguido; solo aplica a lo aún no desbloqueado.
 */
export function resolveTrainingTierAccess(input: IResolveTrainingTierAccessInput): ITrainingTierAccessState {
  const unlockedFloor = Math.max(1, input.progress.highestUnlockedTier ?? 1);
  const tiers = input.catalog.map((tier) => {
    if (tier.tier === 1) {
      return { ...tier, isUnlocked: true, winsInPreviousTier: 0, missingWins: 0 };
    }
    const winsInPreviousTier = readTierWins(input.progress, tier.tier - 1);
    const isUnlocked = winsInPreviousTier >= tier.requiredWinsInPreviousTier || tier.tier <= unlockedFloor;
    return {
      ...tier,
      isUnlocked,
      winsInPreviousTier,
      missingWins: isUnlocked ? 0 : Math.max(0, tier.requiredWinsInPreviousTier - winsInPreviousTier),
    };
  });
  const highestUnlockedTier = tiers.filter((item) => item.isUnlocked).at(-1)?.tier ?? 1;
  return { highestUnlockedTier, tiers };
}
