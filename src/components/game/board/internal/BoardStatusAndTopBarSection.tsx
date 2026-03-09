// src/components/game/board/internal/BoardStatusAndTopBarSection.tsx - Renderiza overlays de estado, narración y barras superiores.
import { BoardStatusOverlays } from "@/components/game/board/ui/overlays/BoardStatusOverlays";
import { CinematicNarrationOverlay } from "@/components/game/board/ui/CinematicNarrationOverlay";
import { BoardMobileTopBar } from "@/components/game/board/ui/layout/BoardMobileTopBar";
import { BoardTopBar } from "@/components/game/board/ui/layout/BoardTopBar";
import { IBoardViewSectionProps } from "@/components/game/board/internal/board-view-types";

export function BoardStatusAndTopBarSection({
  board,
  screen,
  isMobile,
  player,
  opponent,
  playerAvatarUrl,
  opponentAvatarUrl,
}: IBoardViewSectionProps) {
  if (screen.isResultVisible) return null;

  return (
    <>
      <BoardStatusOverlays
        lastError={board.lastError}
        pendingActionHint={board.pendingActionHint}
        pendingEntityReplacement={board.pendingEntityReplacement}
        pendingEntityReplacementTargetCard={screen.pendingReplacementTargetCard}
        combatLog={board.gameState.combatLog}
        playerAId={player.id}
        playerAName={player.name}
        playerBId={opponent.id}
        playerBName={opponent.name}
        isPaused={board.isPaused}
        onResumePause={() => {
          board.playButtonClick();
          board.togglePause();
        }}
        isFusionCinematicActive={board.isFusionCinematicActive}
        setIsFusionCinematicActive={board.setIsFusionCinematicActive}
        graveyardView={screen.effectiveGraveyardView}
        graveyardOwnerName={screen.visibleGraveyardOwner}
        graveyardCards={screen.visibleGraveyardCards}
        graveyardSelectableCardRefs={screen.effectiveGraveyardView === "player" ? screen.pendingGraveyardSelectionRefs : []}
        destroyedView={screen.destroyedView}
        destroyedOwnerName={screen.visibleDestroyedOwner}
        destroyedCards={screen.visibleDestroyedCards}
        onCloseError={() => {
          board.playButtonClick();
          board.clearError();
        }}
        onConfirmEntityReplacement={() => {
          board.playButtonClick();
          board.confirmEntityReplacement();
        }}
        onCancelEntityReplacement={() => {
          board.playButtonClick();
          board.cancelEntityReplacement();
        }}
        onCloseGraveyard={() => screen.setGraveyardView(null)}
        onCloseDestroyed={() => screen.setDestroyedView(null)}
        onPreviewCard={screen.onOverlayCardSelect}
        pendingAdvanceWarning={board.pendingAdvanceWarning}
        onConfirmAdvancePhase={board.confirmAdvancePhase}
        onCancelAdvancePhase={board.cancelAdvancePhase}
        externalBannerSignal={screen.autoModeBannerSignal}
      />
      <CinematicNarrationOverlay
        action={screen.narration.activeCinematicAction}
        playerId={player.id}
        playerAvatarUrl={playerAvatarUrl}
        opponentAvatarUrl={opponentAvatarUrl}
      />
      {isMobile ? (
        <BoardMobileTopBar
          hand={opponent.hand}
          turn={board.gameState.turn}
          phase={board.gameState.phase}
          pendingActionType={board.gameState.pendingTurnAction?.type ?? null}
          pendingActionPlayerId={board.gameState.pendingTurnAction?.playerId ?? null}
          isActive={board.isPlayerTurn}
          isPaused={board.isPaused}
          hasWinner={Boolean(board.winnerPlayerId)}
          onTimeUp={() => {
            board.playTimerExpired();
            board.handleTimerExpired();
          }}
          onWarning={board.playTimerWarning}
        />
      ) : (
        <BoardTopBar
          turn={board.gameState.turn}
          phase={board.gameState.phase}
          pendingActionType={board.gameState.pendingTurnAction?.type ?? null}
          pendingActionPlayerId={board.gameState.pendingTurnAction?.playerId ?? null}
          isPlayerTurn={board.isPlayerTurn}
          isPaused={board.isPaused}
          hasWinner={Boolean(board.winnerPlayerId)}
          onTimeUp={() => {
            board.playTimerExpired();
            board.handleTimerExpired();
          }}
          onWarning={board.playTimerWarning}
        />
      )}
    </>
  );
}
