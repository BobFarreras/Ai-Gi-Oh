// src/components/game/board/hooks/internal/board-state/useSelectedEntityModeActions.ts - Encapsula cambio de modo ataque/defensa para entidad seleccionada en fase BATTLE.
import { useCallback } from "react";
import { ICard } from "@/core/entities/ICard";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";

interface IUseSelectedEntityModeActionsParams {
  gameState: GameState;
  selectedCard: ICard | null;
  winnerPlayerId: string | "DRAW" | null;
  isAnimating: boolean;
  isPlayerTurn: boolean;
  assertPlayerTurn: () => boolean;
  applyTransition: (transition: (state: GameState) => GameState) => GameState | null;
  clearError: () => void;
  setActiveAttackerId: (value: string | null) => void;
  setPlayingCard: (card: ICard | null) => void;
}

interface IUseSelectedEntityModeActionsResult {
  canSetSelectedEntityToAttack: boolean;
  canSetSelectedEntityToDefense: boolean;
  setSelectedEntityToAttack: () => void;
  setSelectedEntityToDefense: () => void;
}

function canToggleSelectedEntityMode(input: IUseSelectedEntityModeActionsParams): boolean {
  return !input.winnerPlayerId && !input.isAnimating && input.isPlayerTurn && input.gameState.phase === "BATTLE" && input.gameState.pendingTurnAction?.playerId !== input.gameState.playerA.id;
}

/** Resuelve acciones de cambio de modo para la carta seleccionada sin acoplar al resto de controles de turno. */
export function useSelectedEntityModeActions(input: IUseSelectedEntityModeActionsParams): IUseSelectedEntityModeActionsResult {
  const selectedDefenseEntity = input.selectedCard
    ? input.gameState.playerA.activeEntities.find((entity) => entity.card.id === input.selectedCard?.id && (entity.mode === "DEFENSE" || entity.mode === "SET") && !entity.hasAttackedThisTurn) ?? null
    : null;
  const selectedAttackEntity = input.selectedCard
    ? input.gameState.playerA.activeEntities.find((entity) => entity.card.id === input.selectedCard?.id && entity.mode === "ATTACK" && !entity.hasAttackedThisTurn) ?? null
    : null;
  const canToggle = canToggleSelectedEntityMode(input);
  const canSetSelectedEntityToAttack = Boolean(selectedDefenseEntity) && canToggle;
  const canSetSelectedEntityToDefense = Boolean(selectedAttackEntity) && canToggle;

  const setSelectedEntityToAttack = useCallback(() => {
    if (!canSetSelectedEntityToAttack || !selectedDefenseEntity || !input.assertPlayerTurn()) return;
    const nextState = input.applyTransition((state) => GameEngine.changeEntityMode(state, state.playerA.id, selectedDefenseEntity.instanceId, "ATTACK"));
    if (!nextState) return;
    input.setActiveAttackerId(selectedDefenseEntity.instanceId);
    input.setPlayingCard(null);
    input.clearError();
  }, [canSetSelectedEntityToAttack, selectedDefenseEntity, input]);

  const setSelectedEntityToDefense = useCallback(() => {
    if (!canSetSelectedEntityToDefense || !selectedAttackEntity || !input.assertPlayerTurn()) return;
    const nextState = input.applyTransition((state) => GameEngine.changeEntityMode(state, state.playerA.id, selectedAttackEntity.instanceId, "DEFENSE"));
    if (!nextState) return;
    input.setActiveAttackerId(null);
    input.setPlayingCard(null);
    input.clearError();
  }, [canSetSelectedEntityToDefense, selectedAttackEntity, input]);

  return { canSetSelectedEntityToAttack, canSetSelectedEntityToDefense, setSelectedEntityToAttack, setSelectedEntityToDefense };
}
