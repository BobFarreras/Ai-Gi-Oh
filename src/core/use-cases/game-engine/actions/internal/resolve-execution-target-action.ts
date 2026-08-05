// src/core/use-cases/game-engine/actions/internal/resolve-execution-target-action.ts - Crea selecciones de objetivo para ejecuciones especiales.
import {
  IDestroyOpponentEntityEffect,
  IFlipOpponentEntityToDefenseEffect,
  ILockOpponentEntityEffect,
  IRevealOpponentSetCardEffect,
  ISacrificeAllyEntityForEnergyEffect,
  IStealOpponentEntityEffect,
  IStealOpponentExecutionEffect,
  IStealOpponentGraveyardCardToHandEffect,
} from "@/core/entities/ICard";
import { IPlayer } from "@/core/entities/IPlayer";
import { GameRuleError } from "@/core/errors/GameRuleError";
import {
  createOpponentEntityToDestroySelectionPendingAction,
  createOpponentEntityToFlipDefenseSelectionPendingAction,
  createOpponentEntityToLockSelectionPendingAction,
  createOpponentEntityToStealSelectionPendingAction,
  createOpponentExecutionToStealSelectionPendingAction,
  createOpponentGraveyardSelectionPendingAction,
  createOpponentSetCardSelectionPendingAction,
  createOwnEntityToSacrificeSelectionPendingAction,
} from "@/core/use-cases/game-engine/state/pending-turn-action-factory";
import { GameState } from "@/core/use-cases/game-engine/state/types";
import { suspendExecutionInSet } from "./suspend-execution";

export interface ISpecialActionContext {
  state: GameState;
  playerId: string;
  player: IPlayer;
  opponent: IPlayer;
  isPlayerA: boolean;
  executionInstanceId: string;
}

export type OpponentSelectionEffect = IRevealOpponentSetCardEffect | IStealOpponentGraveyardCardToHandEffect;
type TargetEffect = OpponentSelectionEffect | ILockOpponentEntityEffect | IDestroyOpponentEntityEffect
  | IFlipOpponentEntityToDefenseEffect | ISacrificeAllyEntityForEnergyEffect
  | IStealOpponentEntityEffect | IStealOpponentExecutionEffect;

function suspend(context: ISpecialActionContext, waitType: string): GameState {
  return suspendExecutionInSet(context.state, context.playerId, context.executionInstanceId, waitType);
}

function pending(context: ISpecialActionContext, pendingTurnAction: GameState["pendingTurnAction"]): GameState {
  return { ...context.state, pendingTurnAction };
}

function resolveOpponentSelection(context: ISpecialActionContext, effect: OpponentSelectionEffect): GameState {
  if (effect.action === "STEAL_OPPONENT_GRAVEYARD_CARD_TO_HAND") {
    const selectable = context.opponent.graveyard.some((card) => !effect.cardType || card.type === effect.cardType);
    if (!selectable) throw new GameRuleError("No hay cartas válidas en cementerio rival para este efecto.");
    return pending(context, createOpponentGraveyardSelectionPendingAction(
      context.playerId, context.executionInstanceId, effect.cardType,
    ));
  }
  const zone = effect.zone ?? "ANY";
  const hasEntity = zone !== "EXECUTIONS" && context.opponent.activeEntities.some((entity) => entity.mode === "SET");
  const hasExecution = zone !== "ENTITIES" && context.opponent.activeExecutions.some((entity) => entity.mode === "SET");
  if (!hasEntity && !hasExecution) return suspend(context, "REVEAL_WAITING_TARGET");
  return pending(context, createOpponentSetCardSelectionPendingAction(
    context.playerId, context.executionInstanceId, zone,
  ));
}

/** Resuelve las variantes de selección sin mezclar sus reglas con fusión o cementerio propio. */
export function resolveExecutionTargetAction(context: ISpecialActionContext, effect: TargetEffect): GameState {
  if (effect.action === "REVEAL_OPPONENT_SET_CARD" || effect.action === "STEAL_OPPONENT_GRAVEYARD_CARD_TO_HAND") {
    return resolveOpponentSelection(context, effect);
  }
  if (effect.action === "LOCK_OPPONENT_ENTITY") {
    if (context.opponent.activeEntities.length === 0) return suspend(context, "LOCK_WAITING_TARGET");
    return pending(context, createOpponentEntityToLockSelectionPendingAction(context.playerId, context.executionInstanceId, effect.turns));
  }
  if (effect.action === "DESTROY_OPPONENT_ENTITY") {
    if (context.opponent.activeEntities.length === 0) return suspend(context, "DESTROY_WAITING_TARGET");
    return pending(context, createOpponentEntityToDestroySelectionPendingAction(context.playerId, context.executionInstanceId));
  }
  if (effect.action === "FLIP_OPPONENT_ENTITY_TO_DEFENSE") {
    if (context.opponent.activeEntities.length === 0) return suspend(context, "FLIP_DEFENSE_WAITING_TARGET");
    return pending(context, createOpponentEntityToFlipDefenseSelectionPendingAction(context.playerId, context.executionInstanceId));
  }
  if (effect.action === "SACRIFICE_ALLY_ENTITY_FOR_ENERGY") {
    if (context.player.activeEntities.length === 0) return suspend(context, "SACRIFICE_WAITING_TARGET");
    return pending(context, createOwnEntityToSacrificeSelectionPendingAction(context.playerId, context.executionInstanceId));
  }
  if (effect.action === "STEAL_OPPONENT_ENTITY") {
    if (context.opponent.activeEntities.length === 0 || context.player.activeEntities.length >= 3) return suspend(context, "STEAL_ENTITY_WAITING_TARGET");
    return pending(context, createOpponentEntityToStealSelectionPendingAction(context.playerId, context.executionInstanceId));
  }
  if (context.opponent.activeExecutions.length === 0) return suspend(context, "STEAL_EXECUTION_WAITING_TARGET");
  return pending(context, createOpponentExecutionToStealSelectionPendingAction(context.playerId, context.executionInstanceId));
}
