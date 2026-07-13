// src/core/use-cases/game-engine/effects/internal/trap-types.ts - Tipos de contexto y resultado para resolución de trampas.
import { IBoardEntity, IPlayer } from "@/core/entities/IPlayer";
import { IStatusEffectSpec } from "@/core/use-cases/game-engine/state/status-effects";

export interface ITrapTriggerContext {
  attackerPlayerId?: string;
  attackerInstanceId?: string;
  buffSourcePlayerId?: string;
  buffStat?: "ATTACK" | "DEFENSE";
  buffAmount?: number;
  /** instanceIds de las entities que recibieron el buff (para anularlo exactamente en ellas). */
  buffTargetEntityIds?: string[];
  summonedPlayerId?: string;
  summonedInstanceId?: string;
}

export interface ITrapResolutionResult {
  player: IPlayer;
  opponent: IPlayer;
  damage: number;
  energyLostTargetPlayerId: string | null;
  energyLostAmount: number;
  energyGainTargetPlayerId: string | null;
  energyGainAmount: number;
  buffTargetEntityIds: string[];
  buffStat: "ATTACK" | "DEFENSE" | null;
  buffAmount: number;
  blockedTargetEntityInstanceId: string | null;
  destroyedOpponentEntityCardId: string | null;
  destroyedOpponentEntityInstanceId: string | null;
  destroyedOpponentEntitySlotIndex: number | null;
  destroyedOpponentEntityDestination: "GRAVEYARD" | "DESTROYED" | null;
  /** Estados multi-turno a añadir a GameState (DoT/HoT de Bandera Windows / Abrazo Hugging). */
  addedStatusEffects?: IStatusEffectSpec[];
  /** Anula el ataque en curso sin destruir al atacante (Flutter Enjambre directo / Metasploit a entity). */
  negatesAttack?: boolean;
}

export interface ITriggeredTrap {
  trap: IBoardEntity;
  player: IPlayer;
  opponent: IPlayer;
  isPlayerA: boolean;
}
