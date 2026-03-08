// src/core/use-cases/game-engine/effects/resolve-trap-trigger.ts - Resuelve trampas reactivas incluyendo contra-trampa para negar y destruir trampas rivales.
import { TrapTrigger } from "@/core/entities/ICard";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { appendTrapResolutionLogs } from "@/core/use-cases/game-engine/effects/internal/trap-logging";
import { resolveTrapEffect } from "@/core/use-cases/game-engine/effects/internal/trap-effect-resolution";
import { selectTriggeredTrap } from "@/core/use-cases/game-engine/effects/internal/trap-selection";
import { ITrapTriggerContext } from "@/core/use-cases/game-engine/effects/internal/trap-types";
import { appendCombatLogEvent } from "@/core/use-cases/game-engine/logging/combat-log";
import { assignPlayers } from "@/core/use-cases/game-engine/state/player-utils";
import { GameState } from "@/core/use-cases/game-engine/state/types";

function selectCounterTrap(opponentExecutions: readonly IBoardEntity[]): IBoardEntity | null {
  return (
    opponentExecutions.find(
      (entity) =>
        entity.card.type === "TRAP" &&
        entity.mode === "SET" &&
        entity.card.trigger === "ON_OPPONENT_TRAP_ACTIVATED" &&
        entity.card.effect?.action === "NEGATE_OPPONENT_TRAP_AND_DESTROY",
    ) ?? null
  );
}

function resolveCounterTrapNegation(
  state: GameState,
  trapOwner: typeof state.playerA,
  counterOwner: typeof state.playerA,
  counterTrap: IBoardEntity,
  trappedCard: IBoardEntity,
  trapOwnerIsPlayerA: boolean,
): GameState {
  const updatedCounterPlayer = {
    ...counterOwner,
    activeExecutions: counterOwner.activeExecutions.filter((entity) => entity.instanceId !== counterTrap.instanceId),
    graveyard: [...counterOwner.graveyard, counterTrap.card],
  };
  const updatedTrapOwner = {
    ...trapOwner,
    activeExecutions: trapOwner.activeExecutions.filter((entity) => entity.instanceId !== trappedCard.instanceId),
    destroyedPile: [...(trapOwner.destroyedPile ?? []), trappedCard.card],
  };
  let withLogs = assignPlayers(state, updatedTrapOwner, updatedCounterPlayer, trapOwnerIsPlayerA);
  withLogs = appendCombatLogEvent(withLogs, counterOwner.id, "TRAP_TRIGGERED", {
    trapCardId: counterTrap.card.id,
    trigger: "ON_OPPONENT_TRAP_ACTIVATED",
    effectAction: counterTrap.card.effect?.action ?? null,
  });
  withLogs = appendCombatLogEvent(withLogs, counterOwner.id, "CARD_TO_GRAVEYARD", {
    cardId: counterTrap.card.id,
    ownerPlayerId: counterOwner.id,
    from: "EXECUTION_ZONE",
  });
  return appendCombatLogEvent(withLogs, counterOwner.id, "CARD_TO_DESTROYED", {
    cardId: trappedCard.card.id,
    ownerPlayerId: trapOwner.id,
    from: "EXECUTION_ZONE",
  });
}

export function resolveTrapTrigger(
  state: GameState,
  reactivePlayerId: string,
  trigger: TrapTrigger,
  context?: ITrapTriggerContext,
): GameState {
  const selectedTrap = selectTriggeredTrap(state, reactivePlayerId, trigger);
  if (!selectedTrap) return state;
  const { trap, player, opponent, isPlayerA } = selectedTrap;
  const counterTrap = selectCounterTrap(opponent.activeExecutions);
  if (counterTrap) {
    return resolveCounterTrapNegation(state, player, opponent, counterTrap, trap, isPlayerA);
  }

  const playerAfterTrapUse = {
    ...player,
    activeExecutions: player.activeExecutions.filter((entity) => entity.instanceId !== trap.instanceId),
    graveyard: [...player.graveyard, trap.card],
  };

  const resolved = resolveTrapEffect(playerAfterTrapUse, opponent, trap, context);
  const baseState = assignPlayers(state, resolved.player, resolved.opponent, isPlayerA);
  return appendTrapResolutionLogs({
    state: baseState,
    reactivePlayerId,
    trigger,
    trap,
    targetOpponentId: opponent.id,
    targetPlayerId: player.id,
    resolved,
  });
}
