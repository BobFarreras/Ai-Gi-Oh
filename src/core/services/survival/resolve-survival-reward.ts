// src/core/services/survival/resolve-survival-reward.ts - Deriva Fragmentos y auditoría sin confiar en el cliente.
import { ISurvivalBattle, ISurvivalRuleset, SurvivalOutcome } from "@/core/entities/survival/ISurvival";

export interface ISurvivalReward {
  ascensionFragments: number;
  definitionId: string;
  milestoneReached: boolean;
}

/**
 * Aplica una curva conservadora y determinista; el cliente nunca aporta importes ni multiplicadores.
 */
export function resolveSurvivalReward(
  battle: ISurvivalBattle,
  ruleset: ISurvivalRuleset,
  definitionId: string,
  outcome: SurvivalOutcome,
): ISurvivalReward {
  if (outcome !== "WIN") {
    return { ascensionFragments: 0, definitionId, milestoneReached: false };
  }
  const milestoneReached = battle.battleIndex % ruleset.milestoneInterval === 0;
  const base = 5 + Math.min(15, battle.effectiveTier) + battle.ascensionRank * 2;
  return {
    ascensionFragments: base + (milestoneReached ? 20 : 0),
    definitionId,
    milestoneReached,
  };
}
