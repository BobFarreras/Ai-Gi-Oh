// src/core/services/survival/resolve-survival-encounter.ts - Escala cada encuentro de forma determinista y acotada.
import { ValidationError } from "@/core/errors/ValidationError";
import {
  ISurvivalEncounter,
  ISurvivalRuleset,
  ISurvivalScalingStage,
} from "@/core/entities/survival/ISurvival";

function resolveStage(battleIndex: number, stages: ISurvivalScalingStage[]): ISurvivalScalingStage {
  const stage = [...stages]
    .sort((left, right) => right.fromBattle - left.fromBattle)
    .find((candidate) => candidate.fromBattle <= battleIndex);
  if (!stage) throw new ValidationError("La configuración de Supervivencia no cubre este combate.");
  return stage;
}

/**
 * Avanza un tier cada bloque de combates y convierte vueltas posteriores en rangos de Ascensión.
 */
export function resolveSurvivalEncounter(
  ruleset: ISurvivalRuleset,
  stages: ISurvivalScalingStage[],
  battleIndex: number,
): ISurvivalEncounter {
  if (!Number.isInteger(battleIndex) || battleIndex < 1 || ruleset.roster.length === 0) {
    throw new ValidationError("No se puede resolver un encuentro de Supervivencia inválido.");
  }
  const stage = resolveStage(battleIndex, stages);
  const uncappedTier = ruleset.startTier + Math.floor((battleIndex - 1) / ruleset.battlesPerTier);
  const effectiveTier = Math.min(uncappedTier, stage.maxTier);
  const firstCappedBattle = (stage.maxTier - ruleset.startTier) * ruleset.battlesPerTier + 1;
  const ascensionRank = Math.floor(
    Math.max(0, battleIndex - firstCappedBattle) / ruleset.roster.length,
  );
  return {
    battleIndex,
    opponentId: ruleset.roster[(battleIndex - 1) % ruleset.roster.length],
    effectiveTier,
    ascensionRank,
    aiProfile: stage.aiProfile,
    maxLpBonus: stage.maxLpBonus * ascensionRank,
    statBonusPerRank: stage.statBonusPerRank,
    rewardDefinitionId: stage.rewardDefinitionId,
  };
}
