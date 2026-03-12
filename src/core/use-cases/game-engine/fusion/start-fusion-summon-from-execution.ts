// src/core/use-cases/game-engine/fusion/start-fusion-summon-from-execution.ts - Inicia la selección de materiales para una fusión activada desde ejecución.
import { GameRuleError } from "@/core/errors/GameRuleError";
import { NotFoundError } from "@/core/errors/NotFoundError";
import { ValidationError } from "@/core/errors/ValidationError";
import { assertFusionCardInFusionDeck } from "@/core/use-cases/game-engine/fusion/internal/assert-fusion-card-in-fusion-deck";
import { resolveSelectableMaterialInstanceIds } from "@/core/use-cases/game-engine/fusion/internal/selectable-material-instance-ids";
import { assertMainPhaseActionAllowedForActivePlayer } from "@/core/use-cases/game-engine/state/action-flow-preconditions";
import { getPlayerPair } from "@/core/use-cases/game-engine/state/player-utils";
import { createFusionMaterialsPendingAction } from "@/core/use-cases/game-engine/state/pending-turn-action-factory";
import { GameState } from "@/core/use-cases/game-engine/state/types";

/**
 * Crea una acción pendiente de selección de materiales cuando una ejecución de fusión es válida.
 * @param state Estado global de la partida.
 * @param playerId Jugador que activa la ejecución de fusión.
 * @param executionInstanceId Instancia de ejecución activa que contiene el efecto de fusión.
 * @param recipeId Identificador de receta de fusión esperado por la ejecución.
 */
export function startFusionSummonFromExecution(
  state: GameState,
  playerId: string,
  executionInstanceId: string,
  recipeId: string,
): GameState {
  assertMainPhaseActionAllowedForActivePlayer(state, playerId, {
    pendingActionMessage: "Debes resolver la acción obligatoria antes de iniciar la fusión.",
    phaseMessage: "Solo puedes iniciar fusión en MAIN_1.",
  });
  const { player } = getPlayerPair(state, playerId);
  const execution = player.activeExecutions.find((entity) => entity.instanceId === executionInstanceId);
  if (!execution) {
    throw new NotFoundError("No existe la ejecución de fusión en tu zona de ejecuciones.");
  }
  if (execution.card.type !== "EXECUTION" || execution.card.effect?.action !== "FUSION_SUMMON") {
    throw new ValidationError("La ejecución seleccionada no permite iniciar fusión.");
  }
  if (player.activeEntities.length < 2) {
    throw new GameRuleError("Necesitas 2 entidades en campo para fusionar.");
  }
  assertFusionCardInFusionDeck(player, recipeId);
  const selectableMaterials = resolveSelectableMaterialInstanceIds(player.activeEntities, recipeId);
  if (selectableMaterials.length < 2) {
    throw new GameRuleError("No puedes fusionar: faltan materiales válidos en el campo.");
  }
  return {
    ...state,
    pendingTurnAction: createFusionMaterialsPendingAction({
      playerId,
      fusionFromExecutionInstanceId: executionInstanceId,
      fusionFromExecutionRecipeId: recipeId,
      mode: "ATTACK",
    }),
  };
}
