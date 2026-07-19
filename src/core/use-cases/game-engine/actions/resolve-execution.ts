// src/core/use-cases/game-engine/actions/resolve-execution.ts - Orquesta la resolución de ejecuciones activas delegando efectos especiales y estándar.
import { IPlayer } from "@/core/entities/IPlayer";
import { GameRuleError } from "@/core/errors/GameRuleError";
import { NotFoundError } from "@/core/errors/NotFoundError";
import { ValidationError } from "@/core/errors/ValidationError";
import { applyExecutionEffect } from "@/core/use-cases/game-engine/actions/internal/execution-effects";
import { appendExecutionResolutionLogs } from "@/core/use-cases/game-engine/actions/internal/execution-logging";
import { executionStandardEffectHasUnmetTarget } from "@/core/use-cases/game-engine/actions/internal/execution-target-guards";
import { resolveExecutionSpecialAction } from "@/core/use-cases/game-engine/actions/internal/resolve-execution-special-actions";
import { suspendExecutionInSet } from "@/core/use-cases/game-engine/actions/internal/suspend-execution";
import { resolveReactiveTrapEvent } from "@/core/use-cases/game-engine/effects/internal/trap-trigger-registry";
import { appendCombatLogEvent } from "@/core/use-cases/game-engine/logging/combat-log";
import { assignPlayers, getPlayerPair } from "@/core/use-cases/game-engine/state/player-utils";
import { addStatusEffects } from "@/core/use-cases/game-engine/state/status-effects";
import { GameState } from "@/core/use-cases/game-engine/state/types";

interface IResolveExecutionOptions {
  skipReactivePlayerIds?: string[];
  skipTrapEventTypes?: ("EXECUTION_ACTIVATED")[];
  /** Dueños cuyo contra-trampa (Nullify) no debe auto-activarse (el jugador decide). */
  skipCounterTrapPlayerIds?: string[];
  /** Ficha 4: trampa concreta que el jugador reactivo eligió activar entre sus elegibles (revalidada). */
  chosenTrapInstanceId?: string;
}

function appendExecutionResultLogs(
  state: GameState,
  playerId: string,
  executionCardId: string,
  executionSlotIndex: number,
  effectResult: ReturnType<typeof applyExecutionEffect>,
): GameState {
  let withLogs = appendExecutionResolutionLogs({
    state,
    playerId,
    executionCardId,
    executionSlotIndex,
    damageTargetPlayerId: effectResult.damageTargetPlayerId,
    damageAmount: effectResult.damageAmount,
    healApplied: effectResult.healApplied,
    energyRecovered: effectResult.energyRecovered,
    energyDrainedTargetPlayerId: effectResult.energyDrainedTargetPlayerId,
    energyDrainedAmount: effectResult.energyDrainedAmount,
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
    { type: "EXECUTION_ACTIVATED", context: { activatedExecutionInstanceId: executionInstanceId } },
    {
      skipReactivePlayerIds: options?.skipReactivePlayerIds,
      skipEventTypes: options?.skipTrapEventTypes,
      skipCounterTrapPlayerIds: options?.skipCounterTrapPlayerIds,
      chosenTrapInstanceId: options?.chosenTrapInstanceId,
    },
  );
  // Escudo Firewall: si una contra-magia anuló y destruyó esta ejecución, no se resuelve su efecto.
  if (withTrapResolution.negatedExecutionInstanceId === executionInstanceId) {
    return { ...withTrapResolution, negatedExecutionInstanceId: undefined };
  }
  const { player, opponent, isPlayerA } = getPlayerPair(withTrapResolution, playerId);
  const executionEntity = player.activeExecutions.find((entity) => entity.instanceId === executionInstanceId);
  const executionSlotIndex = player.activeExecutions.findIndex((entity) => entity.instanceId === executionInstanceId);
  if (!executionEntity) throw new NotFoundError("La ejecución no existe en el tablero.");
  if (!executionEntity.card.effect) throw new GameRuleError("Esta carta no tiene un efecto programado.");
  if (executionEntity.card.type !== "EXECUTION") throw new ValidationError("Solo las ejecuciones activadas pueden resolverse con esta acción.");

  const effect = executionEntity.card.effect;
  if (
    effect.action === "FUSION_SUMMON" ||
    effect.action === "RETURN_GRAVEYARD_CARD_TO_HAND" ||
    effect.action === "RETURN_GRAVEYARD_CARD_TO_FIELD" ||
    effect.action === "REVEAL_OPPONENT_SET_CARD" ||
    effect.action === "STEAL_OPPONENT_GRAVEYARD_CARD_TO_HAND" ||
    effect.action === "LOCK_OPPONENT_ENTITY" ||
    effect.action === "DESTROY_OPPONENT_ENTITY" ||
    effect.action === "FLIP_OPPONENT_ENTITY_TO_DEFENSE" ||
    effect.action === "SACRIFICE_ALLY_ENTITY_FOR_ENERGY" ||
    effect.action === "STEAL_OPPONENT_ENTITY" ||
    effect.action === "STEAL_OPPONENT_EXECUTION"
  ) {
    return resolveExecutionSpecialAction(
      { state: withTrapResolution, playerId, player, opponent, isPlayerA, executionInstanceId },
      effect,
    );
  }

  // Si el efecto necesita un objetivo de tablero que ahora no existe (p.ej. +ATK a un aliado sin
  // entidades propias), no lo consumimos: la carta vuelve a SET y podrá reactivarse en otro turno.
  if (executionStandardEffectHasUnmetTarget(effect, player, opponent)) {
    return suspendExecutionInSet(withTrapResolution, playerId, executionInstanceId, "EXECUTION_WAITING_TARGET");
  }

  const effectResult = applyExecutionEffect(player, opponent, effect);
  const updatedPlayer: IPlayer = {
    ...effectResult.player,
    activeExecutions: effectResult.player.activeExecutions.filter((entity) => entity.instanceId !== executionInstanceId),
    graveyard: [...effectResult.player.graveyard, executionEntity.card],
  };
  const withPlayers = assignPlayers(withTrapResolution, updatedPlayer, effectResult.opponent, isPlayerA);
  // Logueamos los efectos de la ejecución (incl. el buff +X) ANTES de la reacción de trampa al buff, para
  // que un debuff reactivo (OpenClaw) quede como el ÚLTIMO STAT_BUFF_APPLIED y el VFX muestre el -X final.
  let withExecutionLogs = appendExecutionResultLogs(
    withPlayers,
    playerId,
    executionEntity.card.id,
    executionSlotIndex >= 0 ? executionSlotIndex : 0,
    effectResult,
  );
  // Efectos de estado multi-turno (p.ej. "sin ataques directos"): se añaden a GameState y se loguean.
  if (effectResult.addedStatusEffects && effectResult.addedStatusEffects.length > 0) {
    withExecutionLogs = {
      ...withExecutionLogs,
      activeStatusEffects: addStatusEffects(withExecutionLogs.activeStatusEffects, effectResult.addedStatusEffects, withExecutionLogs.turn),
    };
    for (const spec of effectResult.addedStatusEffects) {
      withExecutionLogs = appendCombatLogEvent(withExecutionLogs, playerId, "STATUS_EFFECT_APPLIED", {
        kind: spec.kind,
        targetPlayerId: spec.targetPlayerId,
        remainingTurns: spec.remainingTurns,
      });
    }
  }
  // Núcleo de Datos: concede invocaciones normales extra este turno (contador de GameState).
  if (effectResult.grantedExtraSummons && effectResult.grantedExtraSummons > 0) {
    withExecutionLogs = {
      ...withExecutionLogs,
      extraSummonsThisTurn: (withExecutionLogs.extraSummonsThisTurn ?? 0) + effectResult.grantedExtraSummons,
    };
  }
  // Reacción al buff (OpenClaw etc.): su debuff se resuelve y loguea DESPUÉS del buff de la ejecución.
  return effectResult.buff.stat && effectResult.buff.amount > 0
    ? resolveReactiveTrapEvent(
      withExecutionLogs,
      effectResult.opponent.id,
      {
        type: "EXECUTION_BUFF_APPLIED",
        context: { buffSourcePlayerId: playerId, buffStat: effectResult.buff.stat, buffAmount: effectResult.buff.amount, buffTargetEntityIds: effectResult.buff.entityIds },
      },
      // Coherencia: si el jugador rechazó su contra-trampa para esta ejecución, también aplica al buff.
      { skipCounterTrapPlayerIds: options?.skipCounterTrapPlayerIds },
    )
    : withExecutionLogs;
}
