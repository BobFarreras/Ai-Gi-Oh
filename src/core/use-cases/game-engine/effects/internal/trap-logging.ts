// src/core/use-cases/game-engine/effects/internal/trap-logging.ts - Construye trazas del combatLog para activación y resolución de trampas.
import { IBoardEntity } from "@/core/entities/IPlayer";
import { TrapTrigger } from "@/core/entities/ICard";
import { appendCombatLogEvent } from "@/core/use-cases/game-engine/logging/combat-log";
import { GameState } from "@/core/use-cases/game-engine/state/types";
import { ITrapResolutionResult } from "@/core/use-cases/game-engine/effects/internal/trap-types";

interface ITrapLoggingParams {
  state: GameState;
  reactivePlayerId: string;
  trigger: TrapTrigger;
  trap: IBoardEntity;
  trapSlotIndex: number;
  targetOpponentId: string;
  targetPlayerId: string;
  resolved: ITrapResolutionResult;
}

export function appendTrapResolutionLogs(params: ITrapLoggingParams): GameState {
  const { state, reactivePlayerId, trigger, trap, trapSlotIndex, targetOpponentId, targetPlayerId, resolved } = params;
  let withLogs = appendCombatLogEvent(state, reactivePlayerId, "TRAP_TRIGGERED", {
    trapCardId: trap.card.id,
    trapSlotIndex,
    trigger,
    effectAction: trap.card.effect?.action ?? null,
    blockedTargetEntityInstanceId: resolved.blockedTargetEntityInstanceId,
    destroyedOpponentEntityCardId: resolved.destroyedOpponentEntityCardId,
    destroyedOpponentEntityInstanceId: resolved.destroyedOpponentEntityInstanceId,
    destroyedOpponentEntitySlotIndex: resolved.destroyedOpponentEntitySlotIndex,
  });
  if (resolved.damage > 0 && trap.card.effect?.action === "DAMAGE") {
    withLogs = appendCombatLogEvent(withLogs, reactivePlayerId, "DIRECT_DAMAGE", {
      targetPlayerId: trap.card.effect.target === "OPPONENT" ? targetOpponentId : targetPlayerId,
      amount: resolved.damage,
    });
  }
  if (resolved.buffTargetEntityIds.length > 0 && resolved.buffStat && resolved.buffAmount !== 0) {
    const ownerPlayerId = trap.card.effect?.action === "COPY_OPPONENT_BUFF_TO_ALLIED_ENTITIES" ? reactivePlayerId : targetOpponentId;
    withLogs = appendCombatLogEvent(withLogs, reactivePlayerId, "STAT_BUFF_APPLIED", {
      ownerPlayerId,
      stat: resolved.buffStat,
      amount: resolved.buffAmount,
      targetEntityIds: resolved.buffTargetEntityIds,
    });
  }
  if (resolved.destroyedOpponentEntityCardId) {
    withLogs = appendCombatLogEvent(
      withLogs,
      reactivePlayerId,
      resolved.destroyedOpponentEntityDestination === "DESTROYED" ? "CARD_TO_DESTROYED" : "CARD_TO_GRAVEYARD",
      {
      cardId: resolved.destroyedOpponentEntityCardId,
      ownerPlayerId: targetOpponentId,
      from: "BATTLEFIELD",
    },
    );
  }
  withLogs = appendCombatLogEvent(withLogs, reactivePlayerId, "CARD_TO_GRAVEYARD", {
    cardId: trap.card.id,
    ownerPlayerId: reactivePlayerId,
    from: "EXECUTION_ZONE",
  });
  return withLogs;
}
