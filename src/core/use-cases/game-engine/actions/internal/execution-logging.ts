// src/core/use-cases/game-engine/actions/internal/execution-logging.ts - Construye eventos de log para resoluciones de ejecuciones y efectos derivados.
import { appendCombatLogEvent } from "@/core/use-cases/game-engine/logging/combat-log";
import { GameState } from "@/core/use-cases/game-engine/state/types";

interface IExecutionLoggingParams {
  state: GameState;
  playerId: string;
  executionCardId: string;
  damageTargetPlayerId: string | null;
  damageAmount: number;
  healApplied: number;
  energyRecovered: number;
  buffStat: "ATTACK" | "DEFENSE" | null;
  buffAmount: number;
  buffEntityIds: string[];
}

export function appendExecutionResolutionLogs(params: IExecutionLoggingParams): GameState {
  const {
    state,
    playerId,
    executionCardId,
    damageTargetPlayerId,
    damageAmount,
    healApplied,
    energyRecovered,
    buffStat,
    buffAmount,
    buffEntityIds,
  } = params;

  let withLog = state;
  if (damageTargetPlayerId && damageAmount > 0) {
    withLog = appendCombatLogEvent(withLog, playerId, "DIRECT_DAMAGE", {
      targetPlayerId: damageTargetPlayerId,
      amount: damageAmount,
    });
  }
  if (healApplied > 0) {
    withLog = appendCombatLogEvent(withLog, playerId, "HEAL_APPLIED", {
      targetPlayerId: playerId,
      amount: healApplied,
    });
  }
  if (energyRecovered > 0) {
    withLog = appendCombatLogEvent(withLog, playerId, "ENERGY_GAINED", {
      amount: energyRecovered,
      source: "EXECUTION_RESTORE_ENERGY",
    });
  }
  if (buffStat && buffEntityIds.length > 0) {
    withLog = appendCombatLogEvent(withLog, playerId, "STAT_BUFF_APPLIED", {
      ownerPlayerId: playerId,
      stat: buffStat,
      amount: buffAmount,
      targetEntityIds: buffEntityIds,
    });
  }
  return appendCombatLogEvent(withLog, playerId, "CARD_TO_GRAVEYARD", {
    cardId: executionCardId,
    ownerPlayerId: playerId,
    from: "EXECUTION_ZONE",
  });
}

