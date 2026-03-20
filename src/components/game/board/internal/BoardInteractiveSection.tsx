// src/components/game/board/internal/BoardInteractiveSection.tsx - Sección de interacción del tablero aislada para reducir complejidad del contenedor principal.
"use client";

import { useBoard } from "@/components/game/board/hooks/useBoard";
import { useBoardScreenState } from "@/components/game/board/internal/use-board-screen-state";
import { BoardInteractiveLayer } from "@/components/game/board/ui/layers/BoardInteractiveLayer";

interface IBoardInteractiveSectionProps {
  board: ReturnType<typeof useBoard>;
  screen: ReturnType<typeof useBoardScreenState>;
  isMobile: boolean;
  suppressCombatFeedback?: boolean;
}

/**
 * Renderiza capa interactiva solo cuando no hay overlay final de duelo.
 */
export function BoardInteractiveSection({ board, screen, isMobile, suppressCombatFeedback = false }: IBoardInteractiveSectionProps) {
  if (screen.isResultVisible) return null;
  const player = board.gameState.playerA;
  const opponent = board.gameState.playerB;
  return (
    <BoardInteractiveLayer
      gameState={board.gameState}
      player={player}
      opponent={opponent}
      phase={board.gameState.phase}
      hasNormalSummonedThisTurn={board.gameState.hasNormalSummonedThisTurn}
      selectedCard={board.selectedCard}
      playingCard={board.playingCard}
      activeAttackerId={board.activeAttackerId}
      selectedBoardEntityInstanceId={board.selectedBoardEntityInstanceId}
      revealedEntities={board.revealedEntities}
      pendingEntitySelectionIds={board.pendingEntitySelectionIds}
      pendingDiscardCardIds={board.pendingDiscardCardIds}
      pendingFusionSelectedEntityIds={board.pendingFusionSelectedEntityIds}
      isHistoryOpen={board.isHistoryOpen}
      isPlayerTurn={board.isPlayerTurn}
      lastDamageTargetPlayerId={suppressCombatFeedback ? null : board.lastDamageTargetPlayerId}
      lastDamageEventId={suppressCombatFeedback ? null : board.lastDamageEventId}
      lastBuffTargetEntityIds={suppressCombatFeedback ? [] : board.lastBuffTargetEntityIds}
      lastBuffStat={suppressCombatFeedback ? null : board.lastBuffStat}
      lastBuffAmount={suppressCombatFeedback ? null : board.lastBuffAmount}
      lastBuffEventId={suppressCombatFeedback ? null : board.lastBuffEventId}
      lastCardXpCardId={suppressCombatFeedback ? null : board.lastCardXpCardId}
      lastCardXpAmount={suppressCombatFeedback ? null : board.lastCardXpAmount}
      lastCardXpEventId={suppressCombatFeedback ? null : board.lastCardXpEventId}
      lastCardXpActorPlayerId={suppressCombatFeedback ? null : board.lastCardXpActorPlayerId}
      onGraveyardClick={screen.setGraveyardView}
      onFusionDeckClick={screen.setFusionDeckView}
      onEntityClick={board.handleEntityClick}
      onMandatoryCardSelect={board.resolvePendingHandDiscard}
      onDestroyedClick={screen.setDestroyedView}
      canActivateSelectedExecution={board.canActivateSelectedExecution}
      canSetSelectedEntityToAttack={board.canSetSelectedEntityToAttack}
      onCardClick={board.toggleCardSelection}
      onPlayAction={screen.handlePlayAction}
      onActivateSelectedExecution={screen.handleActivateSelectedExecution}
      onSelectCard={board.previewCard}
      onCloseCard={board.clearSelection}
      onSetSelectedEntityToAttack={board.setSelectedEntityToAttack}
      onCloseHistory={() => board.setIsHistoryOpen(false)}
      isMobileLayout={isMobile}
    />
  );
}
