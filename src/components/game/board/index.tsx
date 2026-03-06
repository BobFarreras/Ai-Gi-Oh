// src/components/game/board/index.tsx - Componente principal del tablero con capas visuales y control de interacción.
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
import { ICard } from "@/core/entities/ICard";

interface IBoardProps {
  initialPlayerDeck?: ICard[] | null;
}

export function Board({ initialPlayerDeck }: IBoardProps) {
  const {
    gameState,
    selectedCard,
    playingCard,
    isHistoryOpen,
    activeAttackerId,
    revealedEntities,
    lastError,
    pendingActionHint,
    pendingEntityReplacement,
    pendingEntityReplacementTargetId,
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
    battleExperienceSummary,
    battleExperienceCardLookup,
    isBattleExperiencePending,
    isPlayerTurn,
    handleTimerExpired,
    confirmEntityReplacement,
    cancelEntityReplacement,
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
    lastCardXpCardId,
    lastCardXpAmount,
    lastCardXpEventId,
    lastCardXpActorPlayerId,
    winnerPlayerId,
    restartMatch,
    isMuted,
    isPaused,
    isFusionCinematicActive,
    setIsFusionCinematicActive,
    toggleMute,
    togglePause,
  } = useBoard(initialPlayerDeck ?? undefined);

  const player = gameState.playerA;
  const opponent = gameState.playerB;
  const [graveyardView, setGraveyardView] = useState<"player" | "opponent" | null>(null);
  const visibleGraveyardCards = useMemo(
    () => (graveyardView === "player" ? player.graveyard : graveyardView === "opponent" ? opponent.graveyard : []),
    [graveyardView, opponent.graveyard, player.graveyard],
  );
  const pendingReplacementTargetCard = useMemo(() => {
    if (!pendingEntityReplacementTargetId) return null;
    return player.activeEntities.find((entity) => entity.instanceId === pendingEntityReplacementTargetId)?.card ?? null;
  }, [pendingEntityReplacementTargetId, player.activeEntities]);
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
    <div className="board-space-bg relative w-full h-screen overflow-hidden font-sans cursor-crosshair" onClick={clearSelection}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(34,211,238,0.12),transparent_52%)] pointer-events-none" />
      <div className="absolute inset-0 shadow-[inset_0_0_200px_rgba(1,4,12,0.58)] pointer-events-none" />
      <BoardStatusOverlays
        lastError={lastError}
        pendingActionHint={pendingActionHint}
        pendingEntityReplacement={pendingEntityReplacement}
        pendingEntityReplacementTargetCard={pendingReplacementTargetCard}
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
        onConfirmEntityReplacement={() => { playButtonClick(); confirmEntityReplacement(); }}
        onCancelEntityReplacement={() => { playButtonClick(); cancelEntityReplacement(); }}
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
        hasWinner={Boolean(winnerPlayerId)}
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
        lastCardXpCardId={lastCardXpCardId} lastCardXpAmount={lastCardXpAmount} lastCardXpEventId={lastCardXpEventId} lastCardXpActorPlayerId={lastCardXpActorPlayerId}
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
      <DuelResultOverlay
        winnerPlayerId={winnerPlayerId}
        playerA={player}
        playerB={opponent}
        battleExperienceSummary={battleExperienceSummary}
        battleExperienceCardLookup={battleExperienceCardLookup}
        isBattleExperiencePending={isBattleExperiencePending}
        onRestart={restartMatch}
      />
    </div>
  );
}
