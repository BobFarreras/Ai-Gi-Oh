// src/components/game/board/internal/BoardStatusAndTopBarSection.tsx - Renderiza overlays de estado, narración y barras superiores.
import { BoardStatusOverlays } from "@/components/game/board/ui/overlays/BoardStatusOverlays";
import { CinematicNarrationOverlay } from "@/components/game/board/ui/CinematicNarrationOverlay";
import { BoardMobileTopBar } from "@/components/game/board/ui/layout/BoardMobileTopBar";
import { BoardTopBar } from "@/components/game/board/ui/layout/BoardTopBar";
import { IFusionMaterialCandidate } from "@/components/game/board/ui/overlays/internal/FusionMaterialBrowser";
import { IBoardViewSectionProps } from "@/components/game/board/internal/board-view-types";
import { MAX_PAUSED_TURNS_MULTIPLAYER } from "@/components/game/board/multiplayer/pause-turn-limit";

export function BoardStatusAndTopBarSection({
  board,
  screen,
  isMobile,
  player,
  opponent,
  playerAvatarUrl,
  opponentAvatarUrl,
  onExitMatch,
  abandonPenaltyNexus = 0,
  isTurnTimerEnabled = true,
  suppressCombatBanners = false,
  isMultiplayer = false,
  onTurnTimeout,
  pausedTurnsUsed = 0,
}: IBoardViewSectionProps) {
  if (screen.isResultVisible) return null;
  // En multi el reloj de turno NO se detiene al pausar: un jugador no puede congelar la partida al rival
  // indefinidamente. El menú de pausa sigue disponible, pero el temporizador corre y auto-pasa al agotarse.
  const isTimerPaused = isMultiplayer ? false : board.isPaused;
  // Board construye onTurnTimeout (incluye la lógica anti-AFK en multi). Fallback defensivo al comportamiento base.
  const handleTimeUp =
    onTurnTimeout ??
    (() => {
      board.playTimerExpired();
      board.handleTimerExpired();
    });
  const pendingFusionAction =
    board.gameState.pendingTurnAction?.type === "SELECT_FUSION_MATERIALS" &&
    board.gameState.pendingTurnAction.playerId === player.id
      ? board.gameState.pendingTurnAction
      : null;
  const selectableIds = new Set(board.pendingEntitySelectionIds);
  const selectedIds = new Set(board.pendingFusionSelectedEntityIds);
  const fusionMaterialCandidates: IFusionMaterialCandidate[] = pendingFusionAction
    ? player.activeEntities
        .filter((entity) => selectableIds.has(entity.instanceId) || selectedIds.has(entity.instanceId))
        .map((entity) => ({
          instanceId: entity.instanceId,
          card: entity.card,
          mode: entity.mode,
          isSelected: selectedIds.has(entity.instanceId),
          isSelectable: selectableIds.has(entity.instanceId),
        }))
    : [];

  return (
    <>
      <BoardStatusOverlays
        lastError={board.lastError}
        pendingActionHint={board.pendingActionHint}
        pendingTrapActivationPrompt={board.pendingTrapActivationPrompt}
        pendingEntityReplacement={board.pendingEntityReplacement}
        pendingEntityReplacementTargetCard={screen.pendingReplacementTargetCard}
        isMobile={isMobile}
        combatLog={board.gameState.combatLog}
        playerAId={player.id}
        playerAName={player.name}
        playerBId={opponent.id}
        playerBName={opponent.name}
        isPaused={board.isPaused}
        isMultiplayer={isMultiplayer}
        pausedTurnsUsed={pausedTurnsUsed}
        maxPausedTurns={MAX_PAUSED_TURNS_MULTIPLAYER}
        onResumePause={() => {
          board.playButtonClick();
          board.togglePause();
        }}
        onExitPause={onExitMatch}
        abandonPenaltyNexus={abandonPenaltyNexus}
        isFusionCinematicActive={board.isFusionCinematicActive}
        setIsFusionCinematicActive={board.setIsFusionCinematicActive}
        graveyardView={screen.effectiveGraveyardView}
        graveyardOwnerName={screen.visibleGraveyardOwner}
        graveyardCards={screen.visibleGraveyardCards}
        graveyardSelectableCardRefs={screen.pendingGraveyardSelectionRefs}
        fusionDeckView={screen.fusionDeckView}
        fusionDeckOwnerName={screen.visibleFusionDeckOwner}
        fusionDeckCards={screen.visibleFusionDeckCards}
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
        onCloseFusionDeck={() => screen.setFusionDeckView(null)}
        onCloseDestroyed={() => screen.setDestroyedView(null)}
        onPreviewCard={screen.onOverlayCardSelect}
        pendingAdvanceWarning={board.pendingAdvanceWarning}
        onConfirmAdvancePhase={board.confirmAdvancePhase}
        onCancelAdvancePhase={board.cancelAdvancePhase}
        externalBannerSignal={screen.autoModeBannerSignal}
        showBattleBanners={!suppressCombatBanners}
        isFusionMaterialBrowserOpen={Boolean(pendingFusionAction)}
        fusionMaterialCandidates={fusionMaterialCandidates}
        fusionSelectedCount={board.pendingFusionSelectedEntityIds.length}
        onSelectFusionMaterial={(instanceId) => board.resolvePendingTurnAction(instanceId)}
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
          isPaused={isTimerPaused}
          hasWinner={Boolean(board.winnerPlayerId)}
          isTimerEnabled={isTurnTimerEnabled}
          onTimeUp={handleTimeUp}
          onWarning={board.playTimerWarning}
        />
      ) : (
        <BoardTopBar
          turn={board.gameState.turn}
          phase={board.gameState.phase}
          pendingActionType={board.gameState.pendingTurnAction?.type ?? null}
          pendingActionPlayerId={board.gameState.pendingTurnAction?.playerId ?? null}
          isPlayerTurn={board.isPlayerTurn}
          isPaused={isTimerPaused}
          hasWinner={Boolean(board.winnerPlayerId)}
          isTimerEnabled={isTurnTimerEnabled}
          onTimeUp={handleTimeUp}
          onWarning={board.playTimerWarning}
        />
      )}
    </>
  );
}
