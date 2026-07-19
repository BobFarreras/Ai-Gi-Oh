// src/core/use-cases/game-engine/state/types.ts - Tipos base del estado de partida, fases y acciones pendientes de turno.
import { ICombatLogEvent } from "@/core/entities/ICombatLog";
import { IPlayer } from "@/core/entities/IPlayer";
import { IActiveStatusEffect } from "@/core/entities/IStatusEffect";
import type { IGameEngineIdFactory } from "@/core/use-cases/game-engine/state/id-factory";

export type TurnPhase = "MAIN_1" | "BATTLE";

export type PendingTurnActionType =
  | "DISCARD_FOR_HAND_LIMIT"
  | "SELECT_FUSION_MATERIALS"
  | "SELECT_GRAVEYARD_CARD"
  | "SELECT_OPPONENT_GRAVEYARD_CARD"
  | "SELECT_OPPONENT_SET_CARD"
  | "SELECT_OPPONENT_ENTITY_TO_LOCK"
  | "SELECT_OPPONENT_ENTITY_TO_DESTROY"
  | "SELECT_OPPONENT_ENTITY_TO_FLIP_DEFENSE"
  | "SELECT_OWN_ENTITY_TO_SACRIFICE"
  | "SELECT_OPPONENT_ENTITY_TO_STEAL"
  | "SELECT_OPPONENT_EXECUTION_TO_STEAL";

interface IBasePendingTurnAction {
  playerId: string;
}

export interface IDiscardForHandLimitPendingTurnAction extends IBasePendingTurnAction {
  type: "DISCARD_FOR_HAND_LIMIT";
}

export interface ISelectFusionMaterialsPendingTurnAction extends IBasePendingTurnAction {
  type: "SELECT_FUSION_MATERIALS";
  fusionCardId?: string;
  fusionFromExecutionInstanceId?: string;
  fusionFromExecutionRecipeId?: string;
  mode: "ATTACK" | "DEFENSE";
  selectedMaterialInstanceIds: string[];
}

export interface ISelectGraveyardCardPendingTurnAction extends IBasePendingTurnAction {
  type: "SELECT_GRAVEYARD_CARD";
  executionInstanceId: string;
  destination: "HAND" | "FIELD";
  cardType?: "ENTITY" | "EXECUTION" | "TRAP" | "FUSION" | "ENVIRONMENT";
}

export interface ISelectOpponentGraveyardCardPendingTurnAction extends IBasePendingTurnAction {
  type: "SELECT_OPPONENT_GRAVEYARD_CARD";
  executionInstanceId: string;
  cardType?: "ENTITY" | "EXECUTION" | "TRAP" | "FUSION" | "ENVIRONMENT";
}

export interface ISelectOpponentSetCardPendingTurnAction extends IBasePendingTurnAction {
  type: "SELECT_OPPONENT_SET_CARD";
  executionInstanceId: string;
  zone: "ENTITIES" | "EXECUTIONS" | "ANY";
}

export interface ISelectOpponentEntityToLockPendingTurnAction extends IBasePendingTurnAction {
  type: "SELECT_OPPONENT_ENTITY_TO_LOCK";
  executionInstanceId: string;
  /** Turnos que durará el bloqueo de la entity elegida. */
  turns: number;
}

export interface ISelectOpponentEntityToDestroyPendingTurnAction extends IBasePendingTurnAction {
  type: "SELECT_OPPONENT_ENTITY_TO_DESTROY";
  executionInstanceId: string;
}

export interface ISelectOpponentEntityToFlipDefensePendingTurnAction extends IBasePendingTurnAction {
  type: "SELECT_OPPONENT_ENTITY_TO_FLIP_DEFENSE";
  executionInstanceId: string;
}

export interface ISelectOwnEntityToSacrificePendingTurnAction extends IBasePendingTurnAction {
  type: "SELECT_OWN_ENTITY_TO_SACRIFICE";
  executionInstanceId: string;
}

export interface ISelectOpponentEntityToStealPendingTurnAction extends IBasePendingTurnAction {
  type: "SELECT_OPPONENT_ENTITY_TO_STEAL";
  executionInstanceId: string;
}

export interface ISelectOpponentExecutionToStealPendingTurnAction extends IBasePendingTurnAction {
  type: "SELECT_OPPONENT_EXECUTION_TO_STEAL";
  executionInstanceId: string;
}

export type IPendingTurnAction =
  | IDiscardForHandLimitPendingTurnAction
  | ISelectFusionMaterialsPendingTurnAction
  | ISelectGraveyardCardPendingTurnAction
  | ISelectOpponentGraveyardCardPendingTurnAction
  | ISelectOpponentSetCardPendingTurnAction
  | ISelectOpponentEntityToLockPendingTurnAction
  | ISelectOpponentEntityToDestroyPendingTurnAction
  | ISelectOpponentEntityToFlipDefensePendingTurnAction
  | ISelectOwnEntityToSacrificePendingTurnAction
  | ISelectOpponentEntityToStealPendingTurnAction
  | ISelectOpponentExecutionToStealPendingTurnAction;

export interface GameState {
  playerA: IPlayer;
  playerB: IPlayer;
  activePlayerId: string;
  startingPlayerId: string;
  turn: number;
  phase: TurnPhase;
  hasNormalSummonedThisTurn: boolean;
  /** Invocaciones normales EXTRA disponibles este turno (Núcleo de Datos). Se resetea al inicio de turno. */
  extraSummonsThisTurn?: number;
  pendingTurnAction?: IPendingTurnAction | null;
  combatLog: ICombatLogEvent[];
  /** Efectos de estado multi-turno a nivel de jugador (p.ej. "sin ataques directos N turnos"). */
  activeStatusEffects?: IActiveStatusEffect[];
  /**
   * Nexus de moneda acumulado en este duelo por la pasiva de Recaudación (ficha 3 v1.17), por jugador
   * (playerId → Nexus). El motor SOLO cuenta aquí; el servidor lo acredita al cerrar el duelo, con topes.
   * Vive en el GameState → determinista en multi. No es LP ni energía: es un contador de recompensa diferida.
   */
  nexusEarnedByPlayerId?: Record<string, number>;
  /**
   * Energía pendiente de conceder por la pasiva de Sobrecarga Energética (ficha 1 v1.17), por jugador
   * (playerId → energía). Se acumula al ganar un combate y se concede (respetando maxEnergy) al INICIO del
   * siguiente turno de ese jugador, limpiándose entonces. Determinista → correcto en multi.
   */
  pendingEnergyBonusByPlayerId?: Record<string, number>;
  /**
   * Energía extra one-time del árbol de habilidades "Arranque en Frío" (ficha 8), por jugador. Se concede en
   * el PRIMER turno de ese jugador POR ENCIMA del tope (a diferencia de la Sobrecarga, que respeta maxEnergy)
   * y se limpia entonces. Al starter se le aplica en la inicialización (su turno 1 ya está activo); al no-starter
   * se le concede vía next-phase al arrancar su primer turno. Solo PvE. Determinista → correcto en multi.
   */
  firstTurnEnergyBonusByPlayerId?: Record<string, number>;
  /**
   * Transitorio dentro de una misma resolución de ataque: instanceId del atacante cuyo ataque ha sido
   * ANULADO por una trampa reactiva sin destruir al atacante (Flutter Enjambre en directo / Escudo
   * Metasploit a entity). `executeAttack` lo consume y lo limpia; no persiste entre acciones.
   */
  negatedAttackAttackerInstanceId?: string;
  /**
   * Transitorio: instanceId de la ejecución anulada y destruida por una contra-magia (Escudo Firewall)
   * antes de resolverse. `resolveExecution` lo consume y lo limpia; no persiste entre acciones.
   */
  negatedExecutionInstanceId?: string;
  idFactory?: IGameEngineIdFactory;
}
