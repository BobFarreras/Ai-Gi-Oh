// src/core/use-cases/game-engine/effects/internal/trap-types.ts - Tipos de contexto y resultado para resolución de trampas.
import { IBoardEntity, IPlayer } from "@/core/entities/IPlayer";
import { IStatusEffectSpec } from "@/core/use-cases/game-engine/state/status-effects";

export interface ITrapTriggerContext {
  attackerPlayerId?: string;
  attackerInstanceId?: string;
  /** instanceId de la entity DEFENSORA atacada (ausente en ataque directo). Para Escudo TypeScript. */
  defenderInstanceId?: string;
  buffSourcePlayerId?: string;
  buffStat?: "ATTACK" | "DEFENSE";
  buffAmount?: number;
  /** instanceIds de las entities que recibieron el buff (para anularlo exactamente en ellas). */
  buffTargetEntityIds?: string[];
  summonedPlayerId?: string;
  summonedInstanceId?: string;
  /** instanceId de la ejecución que el rival acaba de activar (para la contra-magia). */
  activatedExecutionInstanceId?: string;
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
  /**
   * Valor que se MUESTRA en el log y el VFX, que no siempre es el delta real de la estadística. En OpenClaw
   * (`NULLIFY_OPPONENT_BUFF`) la estadística baja el doble del buff, pero al jugador se le enseña el buff
   * bloqueado (-400 para un buff de +400), que es lo que la carta promete. No usar este campo para calcular
   * nada: la estadística ya la deja aplicada el handler.
   */
  buffAmount: number;
  blockedTargetEntityInstanceId: string | null;
  destroyedOpponentEntityCardId: string | null;
  destroyedOpponentEntityInstanceId: string | null;
  destroyedOpponentEntitySlotIndex: number | null;
  destroyedOpponentEntityDestination: "GRAVEYARD" | "DESTROYED" | null;
  /** Zona de origen de la carta destruida para el VFX (por defecto BATTLEFIELD; EXECUTION_ZONE en contra-magia). */
  destroyedOpponentEntityFrom?: "BATTLEFIELD" | "EXECUTION_ZONE";
  /** Estados multi-turno a añadir a GameState (DoT/HoT de Bandera Windows / Abrazo Hugging). */
  addedStatusEffects?: IStatusEffectSpec[];
  /** Anula el ataque en curso sin destruir al atacante (Flutter Enjambre directo / Metasploit a entity). */
  negatesAttack?: boolean;
  /** Escudo Firewall: anula la ejecución que el rival acaba de activar (no se resuelve su efecto). */
  negatesExecution?: boolean;
  /** Escudo TypeScript: la trampa NO se consume (persiste puesta) tras resolverse. */
  keepTrapSet?: boolean;
}

export interface ITriggeredTrap {
  trap: IBoardEntity;
  player: IPlayer;
  opponent: IPlayer;
  isPlayerA: boolean;
}
