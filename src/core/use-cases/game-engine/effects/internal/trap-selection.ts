// src/core/use-cases/game-engine/effects/internal/trap-selection.ts - Selecciona la trampa reactiva aplicable según trigger, condición de activación y estado de tablero.
import { TrapTrigger } from "@/core/entities/ICard";
import { IBoardEntity, IPlayer } from "@/core/entities/IPlayer";
import { getPlayerPair } from "@/core/use-cases/game-engine/state/player-utils";
import { GameState } from "@/core/use-cases/game-engine/state/types";
import { ITrapTriggerContext, ITriggeredTrap } from "@/core/use-cases/game-engine/effects/internal/trap-types";

/**
 * Condición extra de activación de una trampa según su efecto y el contexto del disparo. Por defecto todas
 * las trampas se activan con su trigger; algunas exigen más (Escudo TypeScript solo si atacan a SU entity
 * ligada, no a otra). Si no se cumple, la trampa NO se activa (queda puesta y puede reaccionar más tarde).
 */
function trapActivationConditionMet(trap: IBoardEntity, player: IPlayer, context?: ITrapTriggerContext): boolean {
  const effect = trap.card.effect;
  if (effect?.action === "REINFORCE_LINKED_ENTITY_ON_ATTACK") {
    const defender = context?.defenderInstanceId
      ? player.activeEntities.find((entity) => entity.instanceId === context.defenderInstanceId)
      : null;
    return Boolean(defender && defender.card.id === effect.linkedCardId);
  }
  return true;
}

function findTriggeredTrap(player: IPlayer, trigger: TrapTrigger, context?: ITrapTriggerContext): IBoardEntity | null {
  return (
    player.activeExecutions.find(
      (entity) => entity.card.type === "TRAP" && entity.mode === "SET" && entity.card.trigger === trigger && trapActivationConditionMet(entity, player, context),
    ) ?? null
  );
}

export function selectTriggeredTrap(
  state: GameState,
  reactivePlayerId: string,
  trigger: TrapTrigger,
  context?: ITrapTriggerContext,
): ITriggeredTrap | null {
  const { player, opponent, isPlayerA } = getPlayerPair(state, reactivePlayerId);
  const trap = findTriggeredTrap(player, trigger, context);
  if (!trap) return null;
  return { trap, player, opponent, isPlayerA };
}

