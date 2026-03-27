// src/core/services/training/apply-training-match-result.ts - Actualiza progreso de entrenamiento e informa desbloqueos nuevos.
import { IMatchOutcome } from "@/core/entities/match/IMatchOutcome";
import { ITrainingProgress, ITrainingTierStats } from "@/core/entities/training/ITrainingProgress";
import { ITrainingTierDefinition } from "@/core/entities/training/ITrainingTierDefinition";
import { ValidationError } from "@/core/errors/ValidationError";
import { resolveTrainingTierAccess } from "./resolve-training-tier-access";

interface IApplyTrainingMatchResultInput {
  catalog: ITrainingTierDefinition[];
  progress: ITrainingProgress;
  tier: number;
  outcome: IMatchOutcome;
  updatedAtIso: string;
}

interface IApplyTrainingMatchResultOutput {
  nextProgress: ITrainingProgress;
  newlyUnlockedTiers: number[];
}

function upsertTierStats(tierStats: ITrainingTierStats[], tier: number, didWin: boolean): ITrainingTierStats[] {
  const found = tierStats.find((item) => item.tier === tier);
  if (!found) return [...tierStats, { tier, wins: didWin ? 1 : 0, matches: 1 }];
  return tierStats.map((item) => (item.tier !== tier ? item : { ...item, wins: item.wins + (didWin ? 1 : 0), matches: item.matches + 1 }));
}

/**
 * Aplica resultado de combate de entrenamiento de forma pura para persistir luego en infraestructura.
 */
export function applyTrainingMatchResult(input: IApplyTrainingMatchResultInput): IApplyTrainingMatchResultOutput {
  if (!input.updatedAtIso.trim()) throw new ValidationError("updatedAtIso es obligatorio para actualizar progreso de entrenamiento.");
  if (!input.catalog.some((tier) => tier.tier === input.tier)) throw new ValidationError("El tier de entrenamiento recibido no existe en el catálogo.");
  const beforeAccess = resolveTrainingTierAccess({ catalog: input.catalog, progress: input.progress });
  if (input.tier > beforeAccess.highestUnlockedTier) throw new ValidationError("No se puede registrar resultado en un tier bloqueado.");

  const didWin = input.outcome === "WIN";
  const nextTierStats = upsertTierStats(input.progress.tierStats, input.tier, didWin);
  const nextProgress: ITrainingProgress = {
    ...input.progress,
    totalWins: input.progress.totalWins + (didWin ? 1 : 0),
    totalMatches: input.progress.totalMatches + 1,
    tierStats: nextTierStats,
    updatedAtIso: input.updatedAtIso,
  };
  const afterAccess = resolveTrainingTierAccess({ catalog: input.catalog, progress: nextProgress });
  nextProgress.highestUnlockedTier = afterAccess.highestUnlockedTier;

  const newlyUnlockedTiers = afterAccess.tiers
    .filter((item) => item.isUnlocked && item.tier > beforeAccess.highestUnlockedTier)
    .map((item) => item.tier);

  return { nextProgress, newlyUnlockedTiers };
}
