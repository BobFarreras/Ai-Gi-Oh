// src/components/game/board/index.tsx - Componente principal del tablero con capas visuales y control de interacción.
"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBoard } from "./hooks/useBoard";
import { DuelResultOverlay } from "./ui/DuelResultOverlay";
import { BoardStatusOverlays } from "./ui/overlays/BoardStatusOverlays";
import { BoardTopBar } from "./ui/layout/BoardTopBar";
import { BoardActionButtons } from "./ui/layout/BoardActionButtons";
import { BoardPlayersLayer } from "./ui/layers/BoardPlayersLayer";
import { BoardInteractiveLayer } from "./ui/layers/BoardInteractiveLayer";
import { CinematicNarrationOverlay } from "./ui/CinematicNarrationOverlay";
import { ICard } from "@/core/entities/ICard";
import { IMatchMode } from "@/core/entities/match";
import { ICreateInitialBoardStateInput } from "@/components/game/board/hooks/internal/boardInitialState";
import { IDuelResultRewardSummary } from "./ui/internal/duel-result-reward-summary";
import { IMatchNarrationPack } from "./narration/types";
import { useMatchNarration } from "./hooks/internal/match/useMatchNarration";

interface IBoardProps {
  initialPlayerDeck?: ICard[] | null;
  mode?: IMatchMode;
  initialConfig?: ICreateInitialBoardStateInput;
  duelResultRewardSummary?: IDuelResultRewardSummary | null;
  narrationPack?: IMatchNarrationPack | null;
  playerAvatarUrl?: string | null;
  opponentAvatarUrl?: string | null;
  resultActionLabel?: string;
  onResultAction?: () => void;
  onMatchResolved?: (result: { winnerPlayerId: string | "DRAW"; playerId: string; mode: IMatchMode; matchSeed: string }) => void;
}

export function Board({
  initialPlayerDeck,
  mode = "TRAINING",
  initialConfig,
  duelResultRewardSummary,
  narrationPack,
  playerAvatarUrl = null,
  opponentAvatarUrl = null,
  resultActionLabel,
  onResultAction,
  onMatchResolved,
}: IBoardProps) {
  const {
    gameState,
    selectedCard,
    selectedBoardEntityInstanceId,
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
    resolvePendingTurnAction,
    resolvePendingHandDiscard,
    setSelectedEntityToAttack,
    canSetSelectedEntityToAttack,
    activateSelectedExecution,
    canActivateSelectedExecution,
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
    isAutoPhaseEnabled,
    isFusionCinematicActive,
    setIsFusionCinematicActive,
    toggleMute,
    togglePause,
    toggleAutoPhase,
    playTimerExpired,
    playTimerWarning,
    playButtonClick,
    playBanner,
    pendingAdvanceWarning,
    confirmAdvancePhase,
    cancelAdvancePhase,
    matchSeed,
  } = useBoard(initialPlayerDeck ?? undefined, mode, initialConfig);

  const player = gameState.playerA;
  const opponent = gameState.playerB;
  const [autoModeBannerSignal, setAutoModeBannerSignal] = useState<{ id: string; left: string; right: string } | null>(null);
  const [graveyardView, setGraveyardView] = useState<"player" | "opponent" | null>(null);
  const [destroyedView, setDestroyedView] = useState<"player" | "opponent" | null>(null);
  const effectiveGraveyardView = gameState.pendingTurnAction?.type === "SELECT_GRAVEYARD_CARD" && gameState.pendingTurnAction.playerId === player.id ? "player" : graveyardView;
  const resolvedWinnerRef = useRef<string | "DRAW" | null>(null);
  const visibleGraveyardCards = useMemo(
    () => (effectiveGraveyardView === "player" ? player.graveyard : effectiveGraveyardView === "opponent" ? opponent.graveyard : []),
    [effectiveGraveyardView, opponent.graveyard, player.graveyard],
  );
  const visibleDestroyedCards = useMemo(
    () =>
      destroyedView === "player"
        ? (player.destroyedPile ?? [])
        : destroyedView === "opponent"
          ? (opponent.destroyedPile ?? [])
          : [],
    [destroyedView, opponent.destroyedPile, player.destroyedPile],
  );
  const pendingReplacementTargetCard = useMemo(() => {
    if (!pendingEntityReplacementTargetId || !pendingEntityReplacement) return null;
    const candidates = pendingEntityReplacement.zone === "ENTITIES" ? player.activeEntities : player.activeExecutions;
    return candidates.find((entity) => entity.instanceId === pendingEntityReplacementTargetId)?.card ?? null;
  }, [pendingEntityReplacement, pendingEntityReplacementTargetId, player.activeEntities, player.activeExecutions]);
  const visibleGraveyardOwner = effectiveGraveyardView === "player" ? player.name : opponent.name;
  const visibleDestroyedOwner = destroyedView === "player" ? player.name : opponent.name;
  const narration = useMatchNarration({
    combatLog: gameState.combatLog,
    winnerPlayerId,
    playerId: player.id,
    opponentId: opponent.id,
    isMuted,
    narrationPack,
  });
  const pendingGraveyardSelectionRefs = useMemo(() => {
    const pending = gameState.pendingTurnAction;
    if (!pending || pending.type !== "SELECT_GRAVEYARD_CARD" || pending.playerId !== player.id) return [];
    return player.graveyard
      .filter((card) => !pending.cardType || card.type === pending.cardType)
      .map((card) => card.runtimeId ?? card.id);
  }, [gameState.pendingTurnAction, player.graveyard, player.id]);
  const onOverlayCardSelect = useCallback(
    (card: ICard) => {
      const pending = gameState.pendingTurnAction;
      if (pending?.type === "SELECT_GRAVEYARD_CARD" && pending.playerId === player.id) {
        resolvePendingTurnAction(card.runtimeId ?? card.id);
        setGraveyardView(null);
        return;
      }
      previewCard(card);
    },
    [gameState.pendingTurnAction, player.id, previewCard, resolvePendingTurnAction],
  );

  useEffect(() => {
    if (!winnerPlayerId) {
      resolvedWinnerRef.current = null;
      return;
    }
    if (!onMatchResolved) return;
    if (resolvedWinnerRef.current === winnerPlayerId) return;
    onMatchResolved({ winnerPlayerId, playerId: player.id, mode, matchSeed });
    resolvedWinnerRef.current = winnerPlayerId;
  }, [winnerPlayerId, onMatchResolved, player.id, mode, matchSeed]);

  useEffect(() => {
    if (!winnerPlayerId) return;
    setIsHistoryOpen(false);
  }, [winnerPlayerId, setIsHistoryOpen]);

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
        graveyardView={effectiveGraveyardView}
        graveyardOwnerName={visibleGraveyardOwner}
        graveyardCards={visibleGraveyardCards}
        graveyardSelectableCardRefs={effectiveGraveyardView === "player" ? pendingGraveyardSelectionRefs : []}
        destroyedView={destroyedView}
        destroyedOwnerName={visibleDestroyedOwner}
        destroyedCards={visibleDestroyedCards}
        onCloseError={() => { playButtonClick(); clearError(); }}
        onConfirmEntityReplacement={() => { playButtonClick(); confirmEntityReplacement(); }}
        onCancelEntityReplacement={() => { playButtonClick(); cancelEntityReplacement(); }}
        onCloseGraveyard={() => setGraveyardView(null)}
        onCloseDestroyed={() => setDestroyedView(null)}
        onPreviewCard={onOverlayCardSelect}
        pendingAdvanceWarning={pendingAdvanceWarning}
        onConfirmAdvancePhase={confirmAdvancePhase}
        onCancelAdvancePhase={cancelAdvancePhase}
        externalBannerSignal={autoModeBannerSignal}
      />
      <CinematicNarrationOverlay
        action={narration.activeCinematicAction}
        playerId={player.id}
        playerAvatarUrl={playerAvatarUrl}
        opponentAvatarUrl={opponentAvatarUrl}
      />
      <BoardTopBar
        turn={gameState.turn}
        phase={gameState.phase}
        pendingActionType={gameState.pendingTurnAction?.type ?? null}
        pendingActionPlayerId={gameState.pendingTurnAction?.playerId ?? null}
        isPlayerTurn={isPlayerTurn}
        isPaused={isPaused}
        hasWinner={Boolean(winnerPlayerId)}
        onTimeUp={() => { playTimerExpired(); handleTimerExpired(); }}
        onWarning={playTimerWarning}
      />
      <BoardPlayersLayer
        player={player} opponent={opponent} isPlayerTurn={isPlayerTurn} opponentDifficulty={opponentDifficulty}
        lastDamageTargetPlayerId={lastDamageTargetPlayerId} lastDamageAmount={lastDamageAmount} lastDamageEventId={lastDamageEventId}
        lastHealTargetPlayerId={lastHealTargetPlayerId} lastHealAmount={lastHealAmount} lastHealEventId={lastHealEventId}
        playerAvatarUrl={playerAvatarUrl}
        opponentAvatarUrl={opponentAvatarUrl}
        playerDialogueMessage={narration.hudDialogueByPlayerId[player.id] ?? null}
        opponentDialogueMessage={narration.hudDialogueByPlayerId[opponent.id] ?? null}
        phase={gameState.phase}
        onAdvancePhase={advancePhase}
      />
      <BoardInteractiveLayer
        gameState={gameState} selectedCard={selectedCard} playingCard={playingCard} activeAttackerId={activeAttackerId}
        selectedBoardEntityInstanceId={selectedBoardEntityInstanceId}
        revealedEntities={revealedEntities} pendingEntitySelectionIds={pendingEntitySelectionIds} pendingDiscardCardIds={pendingDiscardCardIds}
        pendingFusionSelectedEntityIds={pendingFusionSelectedEntityIds}
        isHistoryOpen={isHistoryOpen} isPlayerTurn={isPlayerTurn} lastDamageTargetPlayerId={lastDamageTargetPlayerId} lastDamageEventId={lastDamageEventId}
        lastBuffTargetEntityIds={lastBuffTargetEntityIds} lastBuffStat={lastBuffStat} lastBuffAmount={lastBuffAmount} lastBuffEventId={lastBuffEventId}
        lastCardXpCardId={lastCardXpCardId} lastCardXpAmount={lastCardXpAmount} lastCardXpEventId={lastCardXpEventId} lastCardXpActorPlayerId={lastCardXpActorPlayerId}
        onGraveyardClick={setGraveyardView} onEntityClick={handleEntityClick} onMandatoryCardSelect={resolvePendingHandDiscard}
        onDestroyedClick={setDestroyedView}
        canActivateSelectedExecution={canActivateSelectedExecution}
        onCardClick={toggleCardSelection} onPlayAction={executePlayAction} onActivateSelectedExecution={() => {
          void (async () => {
            playButtonClick();
            const result = await activateSelectedExecution();
            if (result === "MISSING_MATERIALS") {
              setAutoModeBannerSignal({
                id: `fusion-missing-materials-${Date.now()}`,
                left: "Fusion",
                right: "Faltan materiales",
              });
              playBanner();
            }
          })();
        }} onSelectCard={previewCard} onCloseCard={clearSelection}
        onCloseHistory={() => setIsHistoryOpen(false)}
      />
      <BoardActionButtons
        isMuted={isMuted}
        isPaused={isPaused}
        isAutoPhaseEnabled={isAutoPhaseEnabled}
        isHistoryOpen={isHistoryOpen}
        canSetSelectedEntityToAttack={canSetSelectedEntityToAttack}
        onToggleMute={() => { playButtonClick(); toggleMute(); }}
        onTogglePause={() => { playButtonClick(); togglePause(); }}
        onToggleAutoPhase={() => {
          playBanner();
          toggleAutoPhase();
          const nextEnabled = !isAutoPhaseEnabled;
          setAutoModeBannerSignal({
            id: `auto-mode-${Date.now()}-${nextEnabled ? "on" : "off"}`,
            left: "Modo Automático",
            right: nextEnabled ? "Activado" : "Desactivado",
          });
        }}
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
        rewardSummary={duelResultRewardSummary}
        resultActionLabel={resultActionLabel}
        onResultAction={onResultAction}
        onRestart={restartMatch}
      />
    </div>
  );
}
