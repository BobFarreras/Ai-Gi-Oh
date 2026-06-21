// src/core/use-cases/game-engine/actions/internal/resolve-execution-special-actions.ts - Encapsula acciones especiales de ejecución que desvían el flujo estándar de resolución.
import {
  CardType,
  IFusionSummonEffect,
  IRevealOpponentSetCardEffect,
  IReturnGraveyardCardToFieldEffect,
  IReturnGraveyardCardToHandEffect,
  IStealOpponentGraveyardCardToHandEffect,
} from "@/core/entities/ICard";
import { IPlayer } from "@/core/entities/IPlayer";
import { GameRuleError } from "@/core/errors/GameRuleError";
import { NotFoundError } from "@/core/errors/NotFoundError";
import { startFusionSummonFromExecution } from "@/core/use-cases/game-engine/fusion/start-fusion-summon-from-execution";
import { resolveSelectableMaterialInstanceIds } from "@/core/use-cases/game-engine/fusion/internal/selectable-material-instance-ids";
import { appendCombatLogEvent } from "@/core/use-cases/game-engine/logging/combat-log";
import { assignPlayers, getPlayerPair } from "@/core/use-cases/game-engine/state/player-utils";
import {
  createGraveyardSelectionPendingAction,
  createOpponentGraveyardSelectionPendingAction,
  createOpponentSetCardSelectionPendingAction,
} from "@/core/use-cases/game-engine/state/pending-turn-action-factory";
import { GameState } from "@/core/use-cases/game-engine/state/types";

interface ISpecialActionContext {
  state: GameState;
  playerId: string;
  player: IPlayer;
  opponent: IPlayer;
  isPlayerA: boolean;
  executionInstanceId: string;
}

type GraveyardReturnEffect = IReturnGraveyardCardToHandEffect | IReturnGraveyardCardToFieldEffect;
type OpponentSelectionEffect = IRevealOpponentSetCardEffect | IStealOpponentGraveyardCardToHandEffect;

function hasSelectableGraveyardCard(player: IPlayer, cardType?: CardType): boolean {
  return player.graveyard.some((card) => !cardType || card.type === cardType);
}

function hasSelectableOpponentGraveyardCard(opponent: IPlayer, cardType?: CardType): boolean {
  return opponent.graveyard.some((card) => !cardType || card.type === cardType);
}

function hasSelectableOpponentSetCard(opponent: IPlayer, zone: "ENTITIES" | "EXECUTIONS" | "ANY"): boolean {
  const entityMatches = zone !== "EXECUTIONS" && opponent.activeEntities.some((entity) => entity.mode === "SET");
  const executionMatches = zone !== "ENTITIES" && opponent.activeExecutions.some((entity) => entity.mode === "SET");
  return entityMatches || executionMatches;
}

/**
 * Deja la ejecución en SET (a la espera) en vez de lanzar error cuando todavía no se cumple la
 * condición para resolverla (faltan materiales de fusión, no hay objetivo válido, etc.). Así la
 * carta no se queda en ACTIVATE rota y puede reactivarse en un turno posterior.
 */
function suspendExecutionUntilCondition(context: ISpecialActionContext, waitType: string): GameState {
  const { state, player, opponent, isPlayerA, playerId, executionInstanceId } = context;
  const executionEntity = player.activeExecutions.find((entity) => entity.instanceId === executionInstanceId);
  if (!executionEntity) throw new NotFoundError("La ejecución no existe en el tablero.");
  const updatedPlayer: IPlayer = {
    ...player,
    activeExecutions: player.activeExecutions.map((entity) =>
      entity.instanceId === executionInstanceId ? { ...entity, mode: "SET" } : entity,
    ),
  };
  const withPlayers = assignPlayers(state, updatedPlayer, opponent, isPlayerA);
  return appendCombatLogEvent(withPlayers, playerId, "MANDATORY_ACTION_RESOLVED", {
    type: waitType,
    executionCardId: executionEntity.card.id,
  });
}

function resolveFusionEffect(context: ISpecialActionContext, effect: IFusionSummonEffect): GameState {
  const { state, playerId, player, executionInstanceId } = context;
  if (player.activeEntities.length < 2) {
    return suspendExecutionUntilCondition(context, "FUSION_WAITING_MATERIALS");
  }
  // Aunque haya entidades suficientes, puede que no cumplan la receta específica.
  // En ese caso suspendemos en SET en vez de lanzar un error que deja la carta en ACTIVATE.
  const selectableMaterials = resolveSelectableMaterialInstanceIds(player.activeEntities, effect.recipeId);
  if (selectableMaterials.length < 2) {
    return suspendExecutionUntilCondition(context, "FUSION_WAITING_MATERIALS");
  }
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
  if (!hasSelectableGraveyardCard(player, cardType)) {
    throw new GameRuleError("No hay cartas válidas en cementerio para este efecto.");
  }
  return {
    ...state,
    pendingTurnAction: createGraveyardSelectionPendingAction(playerId, executionInstanceId, destination, cardType),
  };
}

function resolveGraveyardReturnEffect(context: ISpecialActionContext, effect: GraveyardReturnEffect): GameState {
  if (effect.action === "RETURN_GRAVEYARD_CARD_TO_HAND") {
    return startGraveyardSelection(context.state, context.playerId, context.executionInstanceId, "HAND", effect.cardType);
  }
  return startGraveyardSelection(context.state, context.playerId, context.executionInstanceId, "FIELD", effect.cardType);
}

function resolveOpponentSelectionEffect(context: ISpecialActionContext, effect: OpponentSelectionEffect): GameState {
  if (effect.action === "STEAL_OPPONENT_GRAVEYARD_CARD_TO_HAND") {
    if (!hasSelectableOpponentGraveyardCard(context.opponent, effect.cardType)) {
      throw new GameRuleError("No hay cartas válidas en cementerio rival para este efecto.");
    }
    return {
      ...context.state,
      pendingTurnAction: createOpponentGraveyardSelectionPendingAction(context.playerId, context.executionInstanceId, effect.cardType),
    };
  }
  const zone = effect.zone ?? "ANY";
  // Si el rival no tiene ninguna carta seteada que revelar, dejamos la ejecución a la espera
  // (igual que la fusión sin materiales): se queda en SET y puede reactivarse en otro turno.
  if (!hasSelectableOpponentSetCard(context.opponent, zone)) {
    return suspendExecutionUntilCondition(context, "REVEAL_WAITING_TARGET");
  }
  return {
    ...context.state,
    pendingTurnAction: createOpponentSetCardSelectionPendingAction(context.playerId, context.executionInstanceId, zone),
  };
}

/**
 * Resuelve acciones especiales de ejecución que no siguen el pipeline estándar de `applyExecutionEffect`.
 */
export function resolveExecutionSpecialAction(
  context: ISpecialActionContext,
  effect: IFusionSummonEffect | GraveyardReturnEffect | OpponentSelectionEffect,
): GameState {
  if (effect.action === "FUSION_SUMMON") {
    return resolveFusionEffect(context, effect);
  }
  if (effect.action === "RETURN_GRAVEYARD_CARD_TO_HAND" || effect.action === "RETURN_GRAVEYARD_CARD_TO_FIELD") {
    return resolveGraveyardReturnEffect(context, effect);
  }
  return resolveOpponentSelectionEffect(context, effect);
}
