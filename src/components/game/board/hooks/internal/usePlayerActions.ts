// src/components/game/board/hooks/internal/usePlayerActions.ts - Compone handlers de acciones del jugador reutilizando subhooks especializados.
import { useExecutePlayAction } from "./player-actions/useExecutePlayAction";
import { useHandleEntityClick } from "./player-actions/useHandleEntityClick";
import { useToggleCardSelection } from "./player-actions/useToggleCardSelection";
import { IPlayerActions, IUsePlayerActionsParams } from "./player-actions/types";

export function usePlayerActions(params: IUsePlayerActionsParams): IPlayerActions {
  const toggleCardSelection = useToggleCardSelection({
    isAnimating: params.isAnimating,
    assertPlayerTurn: params.assertPlayerTurn,
    gameState: params.gameState,
    playingCard: params.playingCard,
    clearSelection: params.clearSelection,
    setSelectedCard: params.setSelectedCard,
    setPlayingCard: params.setPlayingCard,
    setActiveAttackerId: params.setActiveAttackerId,
    clearError: params.clearError,
    setLastError: params.setLastError,
  });

  const executePlayAction = useExecutePlayAction({
    applyTransition: params.applyTransition,
    assertPlayerTurn: params.assertPlayerTurn,
    clearError: params.clearError,
    clearSelection: params.clearSelection,
    gameState: params.gameState,
    isAnimating: params.isAnimating,
    playingCard: params.playingCard,
    setActiveAttackerId: params.setActiveAttackerId,
    setPendingEntityReplacement: params.setPendingEntityReplacement,
    setPendingEntityReplacementTargetId: params.setPendingEntityReplacementTargetId,
    setIsAnimating: params.setIsAnimating,
    setLastError: params.setLastError,
    setRevealedEntities: params.setRevealedEntities,
  });

  const handleEntityClick = useHandleEntityClick({
    activeAttackerId: params.activeAttackerId,
    applyTransition: params.applyTransition,
    assertPlayerTurn: params.assertPlayerTurn,
    clearError: params.clearError,
    clearSelection: params.clearSelection,
    gameState: params.gameState,
    isAnimating: params.isAnimating,
    pendingEntityReplacement: params.pendingEntityReplacement,
    pendingEntityReplacementTargetId: params.pendingEntityReplacementTargetId,
    pendingFusionSummon: params.pendingFusionSummon,
    resolvePendingTurnAction: params.resolvePendingTurnAction,
    setActiveAttackerId: params.setActiveAttackerId,
    setIsAnimating: params.setIsAnimating,
    setLastError: params.setLastError,
    setPendingEntityReplacement: params.setPendingEntityReplacement,
    setPendingEntityReplacementTargetId: params.setPendingEntityReplacementTargetId,
    setPendingFusionSummon: params.setPendingFusionSummon,
    setPlayingCard: params.setPlayingCard,
    setRevealedEntities: params.setRevealedEntities,
    setSelectedCard: params.setSelectedCard,
  });

  return { toggleCardSelection, executePlayAction, handleEntityClick };
}
