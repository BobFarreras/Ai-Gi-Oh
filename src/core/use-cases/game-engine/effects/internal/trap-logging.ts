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
  targetOpponentId: string;
  targetPlayerId: string;
  resolved: ITrapResolutionResult;
}

export function appendTrapResolutionLogs(params: ITrapLoggingParams): GameState {
  const { state, reactivePlayerId, trigger, trap, targetOpponentId, targetPlayerId, resolved } = params;
  let withLogs = appendCombatLogEvent(state, reactivePlayerId, "TRAP_TRIGGERED", {
    trapCardId: trap.card.id,
    trigger,
    effectAction: trap.card.effect?.action ?? null,
  });
  withLogs = appendCombatLogEvent(withLogs, reactivePlayerId, "CARD_TO_GRAVEYARD", {
    cardId: trap.card.id,
    ownerPlayerId: reactivePlayerId,
    from: "EXECUTION_ZONE",
  });
  if (resolved.damage > 0 && trap.card.effect?.action === "DAMAGE") {
    withLogs = appendCombatLogEvent(withLogs, reactivePlayerId, "DIRECT_DAMAGE", {
      targetPlayerId: trap.card.effect.target === "OPPONENT" ? targetOpponentId : targetPlayerId,
      amount: resolved.damage,
    });
  }
  if (resolved.destroyedOpponentEntityCardId) {
    withLogs = appendCombatLogEvent(withLogs, reactivePlayerId, "CARD_TO_GRAVEYARD", {
      cardId: resolved.destroyedOpponentEntityCardId,
      ownerPlayerId: targetOpponentId,
      from: "BATTLEFIELD",
    });
  }
  return withLogs;
}
