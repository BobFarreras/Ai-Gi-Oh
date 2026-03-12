// src/components/game/board/internal/BoardInteractiveSection.tsx - Sección de interacción del tablero aislada para reducir complejidad del contenedor principal.
"use client";

import { useBoard } from "@/components/game/board/hooks/useBoard";
import { useBoardScreenState } from "@/components/game/board/internal/use-board-screen-state";
import { BoardInteractiveLayer } from "@/components/game/board/ui/layers/BoardInteractiveLayer";

interface IBoardInteractiveSectionProps {
  board: ReturnType<typeof useBoard>;
  screen: ReturnType<typeof useBoardScreenState>;
  isMobile: boolean;
}

/**
 * Renderiza capa interactiva solo cuando no hay overlay final de duelo.
 */
export function BoardInteractiveSection({ board, screen, isMobile }: IBoardInteractiveSectionProps) {
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
      lastDamageTargetPlayerId={board.lastDamageTargetPlayerId}
      lastDamageEventId={board.lastDamageEventId}
      lastBuffTargetEntityIds={board.lastBuffTargetEntityIds}
      lastBuffStat={board.lastBuffStat}
      lastBuffAmount={board.lastBuffAmount}
      lastBuffEventId={board.lastBuffEventId}
      lastCardXpCardId={board.lastCardXpCardId}
      lastCardXpAmount={board.lastCardXpAmount}
      lastCardXpEventId={board.lastCardXpEventId}
      lastCardXpActorPlayerId={board.lastCardXpActorPlayerId}
      onGraveyardClick={screen.setGraveyardView}
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
