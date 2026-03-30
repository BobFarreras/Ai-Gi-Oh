// src/core/use-cases/game-engine/actions/resolve-execution.ts - Orquesta la resolución de ejecuciones activas delegando efectos especiales y estándar.
import { IPlayer } from "@/core/entities/IPlayer";
import { GameRuleError } from "@/core/errors/GameRuleError";
import { NotFoundError } from "@/core/errors/NotFoundError";
import { ValidationError } from "@/core/errors/ValidationError";
import { applyExecutionEffect } from "@/core/use-cases/game-engine/actions/internal/execution-effects";
import { appendExecutionResolutionLogs } from "@/core/use-cases/game-engine/actions/internal/execution-logging";
import { resolveExecutionSpecialAction } from "@/core/use-cases/game-engine/actions/internal/resolve-execution-special-actions";
import { resolveReactiveTrapEvent } from "@/core/use-cases/game-engine/effects/internal/trap-trigger-registry";
import { appendCombatLogEvent } from "@/core/use-cases/game-engine/logging/combat-log";
import { assignPlayers, getPlayerPair } from "@/core/use-cases/game-engine/state/player-utils";
import { GameState } from "@/core/use-cases/game-engine/state/types";

interface IResolveExecutionOptions {
  skipReactivePlayerIds?: string[];
  skipTrapEventTypes?: ("EXECUTION_ACTIVATED")[];
}

function appendExecutionResultLogs(state: GameState, playerId: string, executionCardId: string, effectResult: ReturnType<typeof applyExecutionEffect>): GameState {
  let withLogs = appendExecutionResolutionLogs({
    state,
    playerId,
    executionCardId,
    damageTargetPlayerId: effectResult.damageTargetPlayerId,
    damageAmount: effectResult.damageAmount,
    healApplied: effectResult.healApplied,
    energyRecovered: effectResult.energyRecovered,
    buffStat: effectResult.buff.stat,
    buffAmount: effectResult.buff.amount,
    buffEntityIds: effectResult.buff.entityIds,
  });
  for (const systemEvent of effectResult.systemEvents) withLogs = appendCombatLogEvent(withLogs, playerId, systemEvent.eventType, systemEvent.payload);
  return withLogs;
}

export function resolveExecution(
  state: GameState,
  playerId: string,
  executionInstanceId: string,
  options?: IResolveExecutionOptions,
): GameState {
  const withTrapResolution = resolveReactiveTrapEvent(
    state,
    getPlayerPair(state, playerId).opponent.id,
    { type: "EXECUTION_ACTIVATED" },
    {
      skipReactivePlayerIds: options?.skipReactivePlayerIds,
      skipEventTypes: options?.skipTrapEventTypes,
    },
  );
  const { player, opponent, isPlayerA } = getPlayerPair(withTrapResolution, playerId);
  const executionEntity = player.activeExecutions.find((entity) => entity.instanceId === executionInstanceId);
  if (!executionEntity) throw new NotFoundError("La ejecución no existe en el tablero.");
  if (!executionEntity.card.effect) throw new GameRuleError("Esta carta no tiene un efecto programado.");
  if (executionEntity.card.type !== "EXECUTION") throw new ValidationError("Solo las ejecuciones activadas pueden resolverse con esta acción.");

  const effect = executionEntity.card.effect;
  if (
    effect.action === "FUSION_SUMMON" ||
    effect.action === "RETURN_GRAVEYARD_CARD_TO_HAND" ||
    effect.action === "RETURN_GRAVEYARD_CARD_TO_FIELD" ||
    effect.action === "REVEAL_OPPONENT_SET_CARD" ||
    effect.action === "STEAL_OPPONENT_GRAVEYARD_CARD_TO_HAND"
  ) {
    return resolveExecutionSpecialAction(
      { state: withTrapResolution, playerId, player, opponent, isPlayerA, executionInstanceId },
      effect,
    );
  }

  const effectResult = applyExecutionEffect(player, opponent, effect);
  const updatedPlayer: IPlayer = {
    ...effectResult.player,
    activeExecutions: effectResult.player.activeExecutions.filter((entity) => entity.instanceId !== executionInstanceId),
    graveyard: [...effectResult.player.graveyard, executionEntity.card],
  };
  const withPlayers = assignPlayers(withTrapResolution, updatedPlayer, effectResult.opponent, isPlayerA);
  const withBuffTrapResolution = effectResult.buff.stat && effectResult.buff.amount > 0
    ? resolveReactiveTrapEvent(withPlayers, effectResult.opponent.id, {
      type: "EXECUTION_BUFF_APPLIED",
      context: { buffSourcePlayerId: playerId, buffStat: effectResult.buff.stat, buffAmount: effectResult.buff.amount },
    })
    : withPlayers;
  return appendExecutionResultLogs(withBuffTrapResolution, playerId, executionEntity.card.id, effectResult);
}
