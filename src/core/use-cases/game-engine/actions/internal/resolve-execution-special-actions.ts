// src/core/use-cases/game-engine/actions/internal/resolve-execution-special-actions.ts - Orquesta ejecuciones especiales de fusión y cementerio.
import {
  CardType,
  IDestroyOpponentEntityEffect,
  IFlipOpponentEntityToDefenseEffect,
  IFusionSummonEffect,
  ILockOpponentEntityEffect,
  IReturnGraveyardCardToFieldEffect,
  IReturnGraveyardCardToHandEffect,
  ISacrificeAllyEntityForEnergyEffect,
  IStealOpponentEntityEffect,
  IStealOpponentExecutionEffect,
} from "@/core/entities/ICard";
import { GameRuleError } from "@/core/errors/GameRuleError";
import { findPlayerFusionCard } from "@/core/use-cases/game-engine/fusion/fusion-recipes";
import { resolveSelectableMaterialInstanceIds } from "@/core/use-cases/game-engine/fusion/internal/selectable-material-instance-ids";
import { startFusionSummonFromExecution } from "@/core/use-cases/game-engine/fusion/start-fusion-summon-from-execution";
import { getPlayerPair } from "@/core/use-cases/game-engine/state/player-utils";
import { createGraveyardSelectionPendingAction } from "@/core/use-cases/game-engine/state/pending-turn-action-factory";
import { GameState } from "@/core/use-cases/game-engine/state/types";
import {
  ISpecialActionContext,
  OpponentSelectionEffect,
  resolveExecutionTargetAction,
} from "./resolve-execution-target-action";
import { suspendExecutionInSet } from "./suspend-execution";

type GraveyardReturnEffect = IReturnGraveyardCardToHandEffect | IReturnGraveyardCardToFieldEffect;
type TargetEffect = OpponentSelectionEffect | ILockOpponentEntityEffect | IDestroyOpponentEntityEffect
  | IFlipOpponentEntityToDefenseEffect | ISacrificeAllyEntityForEnergyEffect
  | IStealOpponentEntityEffect | IStealOpponentExecutionEffect;

/** Mantiene la ejecución preparada cuando su condición todavía no se cumple. */
function suspend(context: ISpecialActionContext, waitType: string): GameState {
  return suspendExecutionInSet(context.state, context.playerId, context.executionInstanceId, waitType);
}

function resolveFusionEffect(context: ISpecialActionContext, effect: IFusionSummonEffect): GameState {
  const { state, playerId, player, executionInstanceId } = context;
  if (player.activeEntities.length < 2) return suspend(context, "FUSION_WAITING_MATERIALS");
  const fusionCard = findPlayerFusionCard(player, effect.recipeId);
  if (!fusionCard) return suspend(context, "FUSION_WAITING_RESULT");
  const selectable = resolveSelectableMaterialInstanceIds(player.activeEntities, fusionCard);
  if (selectable.length < 2) return suspend(context, "FUSION_WAITING_MATERIALS");
  return startFusionSummonFromExecution(state, playerId, executionInstanceId, effect.recipeId);
}

function startGraveyardSelection(
  state: GameState,
  playerId: string,
  executionInstanceId: string,
  destination: "HAND" | "FIELD",
  cardType?: CardType,
): GameState {
  const { player } = getPlayerPair(state, playerId);
  if (!player.graveyard.some((card) => !cardType || card.type === cardType)) {
    throw new GameRuleError("No hay cartas válidas en cementerio para este efecto.");
  }
  return {
    ...state,
    pendingTurnAction: createGraveyardSelectionPendingAction(
      playerId, executionInstanceId, destination, cardType,
    ),
  };
}

function resolveGraveyardEffect(context: ISpecialActionContext, effect: GraveyardReturnEffect): GameState {
  const destination = effect.action === "RETURN_GRAVEYARD_CARD_TO_HAND" ? "HAND" : "FIELD";
  return startGraveyardSelection(
    context.state, context.playerId, context.executionInstanceId, destination, effect.cardType,
  );
}

/** Resuelve acciones especiales que desvían el pipeline estándar de efectos. */
export function resolveExecutionSpecialAction(
  context: ISpecialActionContext,
  effect: IFusionSummonEffect | GraveyardReturnEffect | TargetEffect,
): GameState {
  if (effect.action === "FUSION_SUMMON") return resolveFusionEffect(context, effect);
  if (effect.action === "RETURN_GRAVEYARD_CARD_TO_HAND" || effect.action === "RETURN_GRAVEYARD_CARD_TO_FIELD") {
    return resolveGraveyardEffect(context, effect);
  }
  return resolveExecutionTargetAction(context, effect);
}
