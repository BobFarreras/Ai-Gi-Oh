// src/core/services/olympus/resolve-olympus-reward.ts - Deriva la recompensa de una batalla legendaria desde el catálogo, nunca desde el cliente.
import { IOlympusLegend, IOlympusReward, OlympusOutcome } from "@/core/entities/olympus/IOlympus";

/**
 * La derrota puede dejar una compensación pequeña y explícita; el bonus de primera victoria solo se
 * paga cuando el jugador todavía no lo había cobrado contra esa leyenda.
 */
export function resolveOlympusReward(
  legend: IOlympusLegend,
  outcome: OlympusOutcome,
  hasPreviousVictory: boolean,
): IOlympusReward {
  if (outcome !== "WIN") {
    return {
      ascensionFragments: legend.defeatFragmentReward,
      definitionId: legend.rewardDefinitionId,
      firstVictory: false,
    };
  }
  const firstVictory = !hasPreviousVictory;
  return {
    ascensionFragments: legend.baseFragmentReward + (firstVictory ? legend.firstVictoryFragmentBonus : 0),
    definitionId: legend.rewardDefinitionId,
    firstVictory,
  };
}
