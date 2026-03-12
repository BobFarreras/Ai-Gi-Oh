// src/core/use-cases/game-engine/fusion/start-fusion-summon.ts - Inicia flujo de selección de materiales para fusión desde una carta en mano.
import { GameRuleError } from "@/core/errors/GameRuleError";
import { NotFoundError } from "@/core/errors/NotFoundError";
import { ValidationError } from "@/core/errors/ValidationError";
import { resolveSelectableMaterialInstanceIds } from "@/core/use-cases/game-engine/fusion/internal/selectable-material-instance-ids";
import { assertMainPhaseActionAllowedForActivePlayer } from "@/core/use-cases/game-engine/state/action-flow-preconditions";
import { getPlayerPair } from "@/core/use-cases/game-engine/state/player-utils";
import { createFusionMaterialsPendingAction } from "@/core/use-cases/game-engine/state/pending-turn-action-factory";
import { GameState } from "@/core/use-cases/game-engine/state/types";

export function startFusionSummon(
  state: GameState,
  playerId: string,
  fusionCardId: string,
  mode: "ATTACK" | "DEFENSE",
): GameState {
  assertMainPhaseActionAllowedForActivePlayer(state, playerId, {
    pendingActionMessage: "Debes resolver la acción obligatoria antes de iniciar la fusión.",
    phaseMessage: "Solo puedes iniciar fusión en MAIN_1.",
  });
  const { player } = getPlayerPair(state, playerId);
  const fusionCard = player.hand.find((card) => card.runtimeId === fusionCardId || card.id === fusionCardId);
  if (!fusionCard) {
    throw new NotFoundError("La carta de fusión no está en la mano.");
  }
  if (fusionCard.type !== "FUSION") {
    throw new ValidationError("Solo las cartas de tipo fusión pueden iniciar este flujo.");
  }
  if (player.activeEntities.length < 2) {
    throw new GameRuleError("Necesitas 2 entidades en campo para fusionar.");
  }
  const selectableMaterials = resolveSelectableMaterialInstanceIds(player.activeEntities, fusionCard.id);
  if (selectableMaterials.length < 2) {
    throw new GameRuleError("No puedes fusionar: faltan materiales válidos en el campo.");
  }
  return {
    ...state,
    pendingTurnAction: createFusionMaterialsPendingAction({ playerId, fusionCardId, mode }),
  };
}
