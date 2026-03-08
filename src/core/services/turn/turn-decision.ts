// src/core/services/turn/turn-decision.ts - Reglas puras de decisión para auto-pase y avisos de avance de fase sin dependencias de UI.
import { IBoardEntity } from "@/core/entities/IPlayer";

export interface ITurnBattleDecisionContext {
  phase: string;
  winnerPlayerId: string | "DRAW" | null;
  isAnimating: boolean;
  isPlayerTurn: boolean;
  pendingTurnActionPlayerId: string | null;
  playerId: string;
  activeEntities: ReadonlyArray<IBoardEntity>;
}

export interface ITurnMainDecisionContext {
  phase: string;
  winnerPlayerId: string | "DRAW" | null;
  isAnimating: boolean;
  isPlayerTurn: boolean;
  hasPendingMandatoryAction: boolean;
  playableCardsInHand: number;
}

export interface IAdvanceWarningContext {
  phase: string;
  hasAvailableBattleActions: boolean;
  hasPlayableMainActions: boolean;
}

export type AdvanceWarningCode = "MAIN_SKIP_ACTIONS" | "BATTLE_SKIP_ATTACKS" | null;

function canAttackNow(entity: IBoardEntity): boolean {
  return entity.mode === "ATTACK" && !entity.hasAttackedThisTurn;
}

function canPromoteToAttack(entity: IBoardEntity): boolean {
  return (entity.mode === "DEFENSE" || entity.mode === "SET") && !entity.hasAttackedThisTurn;
}

export function hasAvailableBattleActions(activeEntities: ReadonlyArray<IBoardEntity>): boolean {
  return activeEntities.some((entity) => canAttackNow(entity) || canPromoteToAttack(entity));
}

export function canAutoAdvanceBattle(context: ITurnBattleDecisionContext): boolean {
  if (context.phase !== "BATTLE") return false;
  if (context.winnerPlayerId || context.isAnimating || !context.isPlayerTurn) return false;
  if (context.pendingTurnActionPlayerId === context.playerId) return false;
  return !hasAvailableBattleActions(context.activeEntities);
}

export function canAutoAdvanceMain(context: ITurnMainDecisionContext): boolean {
  if (context.phase !== "MAIN_1") return false;
  if (context.winnerPlayerId || context.isAnimating || !context.isPlayerTurn) return false;
  if (context.hasPendingMandatoryAction) return false;
  return context.playableCardsInHand <= 0;
}

export function shouldShowAdvanceWarning(context: IAdvanceWarningContext): AdvanceWarningCode {
  if (context.phase === "MAIN_1" && context.hasPlayableMainActions) return "MAIN_SKIP_ACTIONS";
  if (context.phase === "BATTLE" && context.hasAvailableBattleActions) return "BATTLE_SKIP_ATTACKS";
  return null;
}
