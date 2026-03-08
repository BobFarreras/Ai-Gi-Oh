// src/core/use-cases/game-engine/effects/internal/trap-types.ts - Tipos de contexto y resultado para resolución de trampas.
import { IBoardEntity, IPlayer } from "@/core/entities/IPlayer";

export interface ITrapTriggerContext {
  attackerPlayerId?: string;
  attackerInstanceId?: string;
}

export interface ITrapResolutionResult {
  player: IPlayer;
  opponent: IPlayer;
  damage: number;
  destroyedOpponentEntityCardId: string | null;
  destroyedOpponentEntityDestination: "GRAVEYARD" | "DESTROYED" | null;
}

export interface ITriggeredTrap {
  trap: IBoardEntity;
  player: IPlayer;
  opponent: IPlayer;
  isPlayerA: boolean;
}
