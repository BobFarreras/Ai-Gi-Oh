// src/core/services/olympus/resolve-olympus-reward.ts - Deriva la recompensa de una batalla legendaria desde el catálogo, nunca desde el cliente.
import { IOlympusLegend, IOlympusReward, OlympusOutcome } from "@/core/entities/olympus/IOlympus";

/**
 * La derrota puede dejar una compensación pequeña y explícita; el bonus de primera victoria solo se
 * paga cuando el jugador todavía no lo había cobrado contra esa leyenda. El Nexus y la carta son la
 * parte del botín que sale de Olimpo hacia el resto del juego, así que se deciden aquí y no en SQL.
 */
export function resolveOlympusReward(
  legend: IOlympusLegend,
  outcome: OlympusOutcome,
  hasPreviousVictory: boolean,
): IOlympusReward {
  if (outcome !== "WIN") {
    return {
      ascensionFragments: legend.defeatFragmentReward,
      nexus: 0,
      cardId: null,
      definitionId: legend.rewardDefinitionId,
      firstVictory: false,
    };
  }
  const firstVictory = !hasPreviousVictory;
  // Con el interruptor activo la carta solo cae la primera vez; si no, cada victoria la repite.
  const grantsCard = legend.cardRewardId !== null && (firstVictory || !legend.cardRewardFirstVictoryOnly);
  return {
    ascensionFragments: legend.baseFragmentReward + (firstVictory ? legend.firstVictoryFragmentBonus : 0),
    nexus: legend.nexusReward,
    cardId: grantsCard ? legend.cardRewardId : null,
    definitionId: legend.rewardDefinitionId,
    firstVictory,
  };
}
