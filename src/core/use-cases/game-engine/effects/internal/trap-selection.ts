// src/core/use-cases/game-engine/effects/internal/trap-selection.ts - Selecciona la trampa reactiva aplicable según trigger y estado de tablero.
import { TrapTrigger } from "@/core/entities/ICard";
import { IBoardEntity, IPlayer } from "@/core/entities/IPlayer";
import { getPlayerPair } from "@/core/use-cases/game-engine/state/player-utils";
import { GameState } from "@/core/use-cases/game-engine/state/types";
import { ITriggeredTrap } from "@/core/use-cases/game-engine/effects/internal/trap-types";

function findTriggeredTrap(player: IPlayer, trigger: TrapTrigger): IBoardEntity | null {
  return (
    player.activeExecutions.find(
      (entity) => entity.card.type === "TRAP" && entity.mode === "SET" && entity.card.trigger === trigger,
    ) ?? null
  );
}

export function selectTriggeredTrap(
  state: GameState,
  reactivePlayerId: string,
  trigger: TrapTrigger,
): ITriggeredTrap | null {
  const { player, opponent, isPlayerA } = getPlayerPair(state, reactivePlayerId);
  const trap = findTriggeredTrap(player, trigger);
  if (!trap) return null;
  return { trap, player, opponent, isPlayerA };
}

