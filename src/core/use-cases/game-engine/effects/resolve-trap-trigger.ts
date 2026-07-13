// src/core/use-cases/game-engine/effects/resolve-trap-trigger.ts - Resuelve trampas reactivas incluyendo contra-trampa para negar y destruir trampas rivales.
import { TrapTrigger } from "@/core/entities/ICard";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { applyOpponentTrapActivationReactions } from "@/core/use-cases/game-engine/effects/internal/trap-activation-reactions";
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
  const counterTrapSlotIndex = counterOwner.activeExecutions.findIndex((entity) => entity.instanceId === counterTrap.instanceId);
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
    trapSlotIndex: counterTrapSlotIndex >= 0 ? counterTrapSlotIndex : 0,
    trigger: "ON_OPPONENT_TRAP_ACTIVATED",
    effectAction: counterTrap.card.effect?.action ?? null,
  });
  withLogs = appendCombatLogEvent(withLogs, counterOwner.id, "CARD_TO_DESTROYED", {
    cardId: trappedCard.card.id,
    ownerPlayerId: trapOwner.id,
    from: "EXECUTION_ZONE",
  });
  return appendCombatLogEvent(withLogs, counterOwner.id, "CARD_TO_GRAVEYARD", {
    cardId: counterTrap.card.id,
    ownerPlayerId: counterOwner.id,
    from: "EXECUTION_ZONE",
  });
}

export interface IResolveTrapTriggerOptions {
  /**
   * Dueños cuyo contra-trampa (Nullify) NO debe auto-activarse. Permite que el jugador decida si
   * activa su Nullify en vez de negarse automáticamente. La contra-trampa pertenece al actor de la
   * acción (el `opponent` del jugador reactivo), por eso se compara contra `opponent.id`.
   */
  skipCounterTrapPlayerIds?: string[];
}

export function resolveTrapTrigger(
  state: GameState,
  reactivePlayerId: string,
  trigger: TrapTrigger,
  context?: ITrapTriggerContext,
  options?: IResolveTrapTriggerOptions,
): GameState {
  const selectedTrap = selectTriggeredTrap(state, reactivePlayerId, trigger);
  if (!selectedTrap) return state;
  const { trap, player, opponent, isPlayerA } = selectedTrap;
  const trapSlotIndex = player.activeExecutions.findIndex((entity) => entity.instanceId === trap.instanceId);
  const counterTrap = options?.skipCounterTrapPlayerIds?.includes(opponent.id)
    ? null
    : selectCounterTrap(opponent.activeExecutions);
  if (counterTrap) {
    return resolveCounterTrapNegation(state, player, opponent, counterTrap, trap, isPlayerA);
  }

  // Resolvemos con la trampa AÚN puesta: los efectos persistentes (Escudo TypeScript) piden que no se
  // consuma (`keepTrapSet`); el resto se manda al cementerio tras resolver.
  const resolved = resolveTrapEffect(player, opponent, trap, context);
  const keepTrapSet = resolved.keepTrapSet === true;
  const playerAfterTrap = keepTrapSet
    ? resolved.player
    : {
        ...resolved.player,
        activeExecutions: resolved.player.activeExecutions.filter((entity) => entity.instanceId !== trap.instanceId),
        graveyard: [...resolved.player.graveyard, trap.card],
      };
  const assigned = assignPlayers(state, playerAfterTrap, resolved.opponent, isPlayerA);
  // Flutter / Metasploit: señala a executeAttack que el ataque de este atacante queda anulado.
  const afterAttackFlag = resolved.negatesAttack && context?.attackerInstanceId
    ? { ...assigned, negatedAttackAttackerInstanceId: context.attackerInstanceId }
    : assigned;
  // Escudo Firewall: señala a resolveExecution que la ejecución activada queda anulada.
  const baseState = resolved.negatesExecution && context?.activatedExecutionInstanceId
    ? { ...afterAttackFlag, negatedExecutionInstanceId: context.activatedExecutionInstanceId }
    : afterAttackFlag;
  const withTrapLogs = appendTrapResolutionLogs({
    state: baseState,
    reactivePlayerId,
    trigger,
    trap,
    trapSlotIndex: trapSlotIndex >= 0 ? trapSlotIndex : 0,
    targetOpponentId: opponent.id,
    targetPlayerId: player.id,
    resolved,
    keepTrapSet,
  });
  // Bandera Windows / Abrazo Hugging: el ACTOR reacciona a que el dueño acaba de activar una trampa.
  return applyOpponentTrapActivationReactions(withTrapLogs, reactivePlayerId);
}
