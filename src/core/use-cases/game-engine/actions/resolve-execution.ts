// src/core/use-cases/game-engine/actions/resolve-execution.ts - Resuelve ejecuciones activas, trampas y flujos pendientes de fusión o selección de cementerio.
import { CardType } from "@/core/entities/ICard";
import { IPlayer } from "@/core/entities/IPlayer";
import { GameRuleError } from "@/core/errors/GameRuleError";
import { NotFoundError } from "@/core/errors/NotFoundError";
import { ValidationError } from "@/core/errors/ValidationError";
import { applyExecutionEffect } from "@/core/use-cases/game-engine/actions/internal/execution-effects";
import { appendExecutionResolutionLogs } from "@/core/use-cases/game-engine/actions/internal/execution-logging";
import { resolveTrapTrigger } from "@/core/use-cases/game-engine/effects/resolve-trap-trigger";
import { startFusionSummonFromExecution } from "@/core/use-cases/game-engine/fusion/start-fusion-summon-from-execution";
import { appendCombatLogEvent } from "@/core/use-cases/game-engine/logging/combat-log";
import { assignPlayers, getPlayerPair } from "@/core/use-cases/game-engine/state/player-utils";
import { GameState } from "@/core/use-cases/game-engine/state/types";

function suspendFusionExecutionUntilMaterials(
  state: GameState,
  playerId: string,
  player: IPlayer,
  opponent: IPlayer,
  isPlayerA: boolean,
  executionInstanceId: string,
): GameState {
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
    type: "FUSION_WAITING_MATERIALS",
    executionCardId: executionEntity.card.id,
  });
}

function resolveFusionExecution(
  state: GameState,
  playerId: string,
  player: IPlayer,
  opponent: IPlayer,
  isPlayerA: boolean,
  executionInstanceId: string,
  recipeId: string,
): GameState {
  if (player.activeEntities.length < 2) {
    return suspendFusionExecutionUntilMaterials(state, playerId, player, opponent, isPlayerA, executionInstanceId);
  }
  return startFusionSummonFromExecution(state, playerId, executionInstanceId, recipeId);
}

function hasSelectableGraveyardCard(player: IPlayer, cardType?: CardType): boolean {
  return player.graveyard.some((card) => !cardType || card.type === cardType);
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
  return { ...state, pendingTurnAction: { type: "SELECT_GRAVEYARD_CARD", playerId, executionInstanceId, destination, cardType } };
}

function appendExecutionResultLogs(state: GameState, playerId: string, executionCardId: string, effectResult: ReturnType<typeof applyExecutionEffect>): GameState {
  let withLogs = appendExecutionResolutionLogs({
    state,
    playerId,
    executionCardId,
    damageTargetPlayerId: effectResult.damageTargetPlayerId,
    damageAmount: effectResult.damageAmount,
    healApplied: effectResult.healApplied,
    buffStat: effectResult.buff.stat,
    buffAmount: effectResult.buff.amount,
    buffEntityIds: effectResult.buff.entityIds,
  });
  for (const systemEvent of effectResult.systemEvents) withLogs = appendCombatLogEvent(withLogs, playerId, systemEvent.eventType, systemEvent.payload);
  return withLogs;
}

export function resolveExecution(state: GameState, playerId: string, executionInstanceId: string): GameState {
  const withTrapResolution = resolveTrapTrigger(state, getPlayerPair(state, playerId).opponent.id, "ON_OPPONENT_EXECUTION_ACTIVATED");
  const { player, opponent, isPlayerA } = getPlayerPair(withTrapResolution, playerId);
  const executionEntity = player.activeExecutions.find((entity) => entity.instanceId === executionInstanceId);
  if (!executionEntity) throw new NotFoundError("La ejecución no existe en el tablero.");
  if (!executionEntity.card.effect) throw new GameRuleError("Esta carta no tiene un efecto programado.");
  if (executionEntity.card.type !== "EXECUTION") throw new ValidationError("Solo las ejecuciones activadas pueden resolverse con esta acción.");

  const effect = executionEntity.card.effect;
  if (effect.action === "FUSION_SUMMON") {
    return resolveFusionExecution(withTrapResolution, playerId, player, opponent, isPlayerA, executionInstanceId, effect.recipeId);
  }
  if (effect.action === "RETURN_GRAVEYARD_CARD_TO_HAND") {
    return startGraveyardSelection(withTrapResolution, playerId, executionInstanceId, "HAND", effect.cardType);
  }
  if (effect.action === "RETURN_GRAVEYARD_CARD_TO_FIELD") {
    return startGraveyardSelection(withTrapResolution, playerId, executionInstanceId, "FIELD", effect.cardType);
  }

  const effectResult = applyExecutionEffect(player, opponent, effect);
  const updatedPlayer: IPlayer = {
    ...effectResult.player,
    activeExecutions: effectResult.player.activeExecutions.filter((entity) => entity.instanceId !== executionInstanceId),
    graveyard: [...effectResult.player.graveyard, executionEntity.card],
  };
  const withPlayers = assignPlayers(withTrapResolution, updatedPlayer, effectResult.opponent, isPlayerA);
  return appendExecutionResultLogs(withPlayers, playerId, executionEntity.card.id, effectResult);
}
