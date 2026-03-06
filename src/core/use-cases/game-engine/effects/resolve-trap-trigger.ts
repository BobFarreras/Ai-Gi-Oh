import { TrapTrigger } from "@/core/entities/ICard";
import { appendTrapResolutionLogs } from "@/core/use-cases/game-engine/effects/internal/trap-logging";
import { resolveTrapEffect } from "@/core/use-cases/game-engine/effects/internal/trap-effect-resolution";
import { selectTriggeredTrap } from "@/core/use-cases/game-engine/effects/internal/trap-selection";
import { ITrapTriggerContext } from "@/core/use-cases/game-engine/effects/internal/trap-types";
import { assignPlayers } from "@/core/use-cases/game-engine/state/player-utils";
import { GameState } from "@/core/use-cases/game-engine/state/types";

export function resolveTrapTrigger(
  state: GameState,
  reactivePlayerId: string,
  trigger: TrapTrigger,
  context?: ITrapTriggerContext,
): GameState {
  const selectedTrap = selectTriggeredTrap(state, reactivePlayerId, trigger);
  if (!selectedTrap) return state;
  const { trap, player, opponent, isPlayerA } = selectedTrap;

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
