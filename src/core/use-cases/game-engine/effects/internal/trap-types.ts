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
}

export interface ITriggeredTrap {
  trap: IBoardEntity;
  player: IPlayer;
  opponent: IPlayer;
  isPlayerA: boolean;
}
