// src/core/use-cases/game-engine/effects/internal/trap-activation-reactions.ts - Aplica las reacciones
// ON_OPPONENT_TRAP_ACTIVATED de tipo estado (Bandera Windows DoT / Abrazo Hugging HoT) del ACTOR cuando el
// dueño de una trampa la activa. Es TERMINAL: resuelve el efecto sin re-disparar triggers, por lo que no
// puede encadenar recursiones ni volver a activar el contra-trampa Nullify.
import { IBoardEntity } from "@/core/entities/IPlayer";
import { resolveTrapEffect } from "@/core/use-cases/game-engine/effects/internal/trap-effect-resolution";
import { appendCombatLogEvent } from "@/core/use-cases/game-engine/logging/combat-log";
import { assignPlayers, getPlayerPair } from "@/core/use-cases/game-engine/state/player-utils";
import { addStatusEffects } from "@/core/use-cases/game-engine/state/status-effects";
import { GameState } from "@/core/use-cases/game-engine/state/types";

const STATUS_REACTION_ACTIONS = new Set(["APPLY_DAMAGE_OVER_TIME", "APPLY_HEAL_OVER_TIME"]);

function isStatusReactionTrap(entity: IBoardEntity): boolean {
  return (
    entity.card.type === "TRAP" &&
    entity.mode === "SET" &&
    entity.card.trigger === "ON_OPPONENT_TRAP_ACTIVATED" &&
    entity.card.effect !== undefined &&
    STATUS_REACTION_ACTIONS.has(entity.card.effect.action)
  );
}

function applySingleReaction(state: GameState, trapOwnerId: string, reactionInstanceId: string): GameState {
  const { player: trapOwner, opponent: actor, isPlayerA: trapOwnerIsPlayerA } = getPlayerPair(state, trapOwnerId);
  const slotIndex = actor.activeExecutions.findIndex((entity) => entity.instanceId === reactionInstanceId);
  const reaction = slotIndex >= 0 ? actor.activeExecutions[slotIndex] : null;
  if (!reaction) return state;

  const actorAfterUse = {
    ...actor,
    activeExecutions: actor.activeExecutions.filter((entity) => entity.instanceId !== reactionInstanceId),
    graveyard: [...actor.graveyard, reaction.card],
  };
  // player = dueño de la trampa de estado (actor); opponent = quien activó la trampa (trapOwner).
  const resolved = resolveTrapEffect(actorAfterUse, trapOwner, reaction, undefined);
  let next = assignPlayers(state, resolved.player, resolved.opponent, !trapOwnerIsPlayerA);
  if (resolved.addedStatusEffects && resolved.addedStatusEffects.length > 0) {
    next = { ...next, activeStatusEffects: addStatusEffects(next.activeStatusEffects, resolved.addedStatusEffects, next.turn) };
  }
  next = appendCombatLogEvent(next, actor.id, "TRAP_TRIGGERED", {
    trapCardId: reaction.card.id,
    trapSlotIndex: slotIndex,
    trigger: "ON_OPPONENT_TRAP_ACTIVATED",
    effectAction: reaction.card.effect?.action ?? null,
  });
  for (const spec of resolved.addedStatusEffects ?? []) {
    next = appendCombatLogEvent(next, actor.id, "STATUS_EFFECT_APPLIED", {
      kind: spec.kind,
      targetPlayerId: spec.targetPlayerId,
      remainingTurns: spec.remainingTurns,
      magnitude: spec.magnitude,
    });
  }
  return appendCombatLogEvent(next, actor.id, "CARD_TO_GRAVEYARD", {
    cardId: reaction.card.id,
    ownerPlayerId: actor.id,
    from: "EXECUTION_ZONE",
  });
}

/**
 * Dispara las trampas de estado del actor (rival del dueño de la trampa que se acaba de activar) que
 * reaccionan a `ON_OPPONENT_TRAP_ACTIVATED`. Se llama tras resolver la trampa original.
 */
export function applyOpponentTrapActivationReactions(state: GameState, trapOwnerId: string): GameState {
  const { opponent: actor } = getPlayerPair(state, trapOwnerId);
  const reactionIds = actor.activeExecutions.filter(isStatusReactionTrap).map((entity) => entity.instanceId);
  let current = state;
  for (const reactionId of reactionIds) {
    current = applySingleReaction(current, trapOwnerId, reactionId);
  }
  return current;
}
