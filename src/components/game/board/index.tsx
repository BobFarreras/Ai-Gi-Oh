"use client";
import { useMemo, useState } from "react";
import { useBoard } from "./hooks/useBoard";
import { DuelResultOverlay } from "./ui/DuelResultOverlay";
import { useGameAudio } from "./hooks/internal/useGameAudio";
import { BoardStatusOverlays } from "./ui/overlays/BoardStatusOverlays";
import { BoardTopBar } from "./ui/layout/BoardTopBar";
import { BoardActionButtons } from "./ui/layout/BoardActionButtons";
import { BoardPlayersLayer } from "./ui/layers/BoardPlayersLayer";
import { BoardInteractiveLayer } from "./ui/layers/BoardInteractiveLayer";

export function Board() {
  const {
    gameState,
    selectedCard,
    playingCard,
    isHistoryOpen,
    activeAttackerId,
    revealedEntities,
    lastError,
    pendingActionHint,
    pendingDiscardCardIds,
    pendingEntitySelectionIds,
    pendingFusionSelectedEntityIds,
    opponentDifficulty,
    setIsHistoryOpen,
    toggleCardSelection,
    clearSelection,
    previewCard,
    clearError,
    executePlayAction,
    handleEntityClick,
    advancePhase,
    resolvePendingHandDiscard,
    setSelectedEntityToAttack,
    canSetSelectedEntityToAttack,
    isPlayerTurn,
    handleTimerExpired,
    lastDamageTargetPlayerId,
    lastDamageAmount,
    lastDamageEventId,
    lastHealTargetPlayerId,
    lastHealAmount,
    lastHealEventId,
    lastBuffTargetEntityIds,
    lastBuffStat,
    lastBuffAmount,
    lastBuffEventId,
    winnerPlayerId,
    restartMatch,
    isMuted,
    isPaused,
    isFusionCinematicActive,
    setIsFusionCinematicActive,
    toggleMute,
    togglePause,
  } = useBoard();

  const player = gameState.playerA;
  const opponent = gameState.playerB;
  const [graveyardView, setGraveyardView] = useState<"player" | "opponent" | null>(null);
  const visibleGraveyardCards = useMemo(
    () => (graveyardView === "player" ? player.graveyard : graveyardView === "opponent" ? opponent.graveyard : []),
    [graveyardView, opponent.graveyard, player.graveyard],
  );
  const visibleGraveyardOwner = graveyardView === "player" ? player.name : opponent.name;
  const { playTimerExpired, playTimerWarning, playButtonClick } = useGameAudio({
    combatLog: gameState.combatLog,
    winnerPlayerId,
    playerId: player.id,
    isHistoryOpen,
    hasSelectedCard: Boolean(selectedCard),
    lastErrorCode: lastError?.code ?? null,
    isMuted,
    isPaused,
  });


  return (
    <div className="relative w-full h-screen bg-[#020305] overflow-hidden font-sans cursor-crosshair" onClick={clearSelection}>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[100px_100px] pointer-events-none" />
      <div className="absolute inset-0 shadow-[inset_0_0_300px_rgba(0,0,0,1)] pointer-events-none" />
      <BoardStatusOverlays
        lastError={lastError}
        pendingActionHint={pendingActionHint}
        combatLog={gameState.combatLog}
        playerAId={gameState.playerA.id}
        playerAName={gameState.playerA.name}
        playerBId={gameState.playerB.id}
        playerBName={gameState.playerB.name}
        isPaused={isPaused}
        onResumePause={() => { playButtonClick(); togglePause(); }}
        isFusionCinematicActive={isFusionCinematicActive}
        setIsFusionCinematicActive={setIsFusionCinematicActive}
        graveyardView={graveyardView}
        graveyardOwnerName={visibleGraveyardOwner}
        graveyardCards={visibleGraveyardCards}
        onCloseError={() => { playButtonClick(); clearError(); }}
        onCloseGraveyard={() => setGraveyardView(null)}
        onPreviewCard={previewCard}

      />
      <BoardTopBar
        turn={gameState.turn}
        phase={gameState.phase}
        hasNormalSummonedThisTurn={gameState.hasNormalSummonedThisTurn}
        pendingActionType={gameState.pendingTurnAction?.type ?? null}
        pendingActionPlayerId={gameState.pendingTurnAction?.playerId ?? null}
        isPlayerTurn={isPlayerTurn}
        isPaused={isPaused}
        onAdvancePhase={advancePhase}
        onTimeUp={() => { playTimerExpired(); handleTimerExpired(); }}
        onWarning={playTimerWarning}
      />
      <BoardPlayersLayer
        player={player} opponent={opponent} isPlayerTurn={isPlayerTurn} opponentDifficulty={opponentDifficulty}
        lastDamageTargetPlayerId={lastDamageTargetPlayerId} lastDamageAmount={lastDamageAmount} lastDamageEventId={lastDamageEventId}
        lastHealTargetPlayerId={lastHealTargetPlayerId} lastHealAmount={lastHealAmount} lastHealEventId={lastHealEventId}
      />
      <BoardInteractiveLayer
        gameState={gameState} selectedCard={selectedCard} playingCard={playingCard} activeAttackerId={activeAttackerId}
        revealedEntities={revealedEntities} pendingEntitySelectionIds={pendingEntitySelectionIds} pendingDiscardCardIds={pendingDiscardCardIds}
        pendingFusionSelectedEntityIds={pendingFusionSelectedEntityIds}
        isHistoryOpen={isHistoryOpen} isPlayerTurn={isPlayerTurn} lastDamageTargetPlayerId={lastDamageTargetPlayerId} lastDamageEventId={lastDamageEventId}
        lastBuffTargetEntityIds={lastBuffTargetEntityIds} lastBuffStat={lastBuffStat} lastBuffAmount={lastBuffAmount} lastBuffEventId={lastBuffEventId}
        onGraveyardClick={setGraveyardView} onEntityClick={handleEntityClick} onMandatoryCardSelect={resolvePendingHandDiscard}
        onCardClick={toggleCardSelection} onPlayAction={executePlayAction} onSelectCard={previewCard} onCloseCard={clearSelection}
        onCloseHistory={() => setIsHistoryOpen(false)}
      />
      <BoardActionButtons
        isMuted={isMuted}
        isPaused={isPaused}
        isHistoryOpen={isHistoryOpen}
        canSetSelectedEntityToAttack={canSetSelectedEntityToAttack}
        onToggleMute={() => { playButtonClick(); toggleMute(); }}
        onTogglePause={() => { playButtonClick(); togglePause(); }}
        onToggleHistory={() => { playButtonClick(); setIsHistoryOpen((previous) => !previous); }}
        onSetSelectedEntityToAttack={() => { playButtonClick(); setSelectedEntityToAttack(); }}
      />
      <DuelResultOverlay winnerPlayerId={winnerPlayerId} playerA={player} playerB={opponent} onRestart={restartMatch} />
    </div>
  );
}
