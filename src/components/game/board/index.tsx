// src/components/game/board/index.tsx - Componente principal del tablero con capas visuales y control de interacción.
"use client";
import { useBoard } from "./hooks/useBoard";
import { DuelResultOverlay } from "./ui/DuelResultOverlay";
import { BoardInteractiveLayer } from "./ui/layers/BoardInteractiveLayer";
import { ICard } from "@/core/entities/ICard";
import { IMatchMode } from "@/core/entities/match";
import { ICreateInitialBoardStateInput } from "@/components/game/board/hooks/internal/boardInitialState";
import { IDuelResultRewardSummary } from "./ui/internal/duel-result/duel-result-reward-summary";
import { IMatchNarrationPack } from "./narration/types";
import { useBoardViewportMode } from "./hooks/internal/layout/use-board-viewport-mode";
import { countRender } from "@/services/performance/dev-performance-telemetry";
import { useBoardScreenState } from "@/components/game/board/internal/use-board-screen-state";
import { BoardStatusAndTopBarSection } from "@/components/game/board/internal/BoardStatusAndTopBarSection";
import { BoardPlayersSection } from "@/components/game/board/internal/BoardPlayersSection";
import { BoardActionControlsSection } from "@/components/game/board/internal/BoardActionControlsSection";
import { useBoardPerformanceProfile } from "@/components/game/board/internal/use-board-performance-profile";
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
export function Board({ initialPlayerDeck, mode = "TRAINING", initialConfig, duelResultRewardSummary, narrationPack, playerAvatarUrl = null, opponentAvatarUrl = null, resultActionLabel, onResultAction, onMatchResolved }: IBoardProps) {
  countRender("Board");
  const board = useBoard(initialPlayerDeck ?? undefined, mode, initialConfig);
  const player = board.gameState.playerA; const opponent = board.gameState.playerB;
  const { isMobile } = useBoardViewportMode();
  const { shouldReduceCombatEffects } = useBoardPerformanceProfile();
  const screen = useBoardScreenState({
    board,
    mode,
    playerId: player.id,
    playerName: player.name,
    opponentId: opponent.id,
    opponentName: opponent.name,
    playerGraveyard: player.graveyard,
    opponentGraveyard: opponent.graveyard,
    playerDestroyed: player.destroyedPile ?? [],
    opponentDestroyed: opponent.destroyedPile ?? [],
    playerActiveEntities: player.activeEntities,
    playerActiveExecutions: player.activeExecutions,
    duelResultRewardSummary,
    narrationPack,
    onMatchResolved,
  });
  return (
    <div className={`board-space-bg relative w-full h-screen overflow-hidden font-sans cursor-crosshair ${shouldReduceCombatEffects ? "reduced-combat-effects" : ""}`} onClick={board.clearSelection}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(34,211,238,0.12),transparent_52%)] pointer-events-none" />
      <div className="absolute inset-0 shadow-[inset_0_0_200px_rgba(1,4,12,0.58)] pointer-events-none" />
      <BoardStatusAndTopBarSection
        board={board}
        screen={screen}
        isMobile={isMobile}
        player={player}
        opponent={opponent}
        playerAvatarUrl={playerAvatarUrl}
        opponentAvatarUrl={opponentAvatarUrl}
      />
      <BoardPlayersSection
        board={board}
        screen={screen}
        isMobile={isMobile}
        player={player}
        opponent={opponent}
        playerAvatarUrl={playerAvatarUrl}
        opponentAvatarUrl={opponentAvatarUrl}
      />
      {!screen.isResultVisible && (
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
      )}
      <BoardActionControlsSection
        board={board}
        screen={screen}
        isMobile={isMobile}
        player={player}
        opponent={opponent}
        playerAvatarUrl={playerAvatarUrl}
        opponentAvatarUrl={opponentAvatarUrl}
      />
      <DuelResultOverlay
        winnerPlayerId={board.winnerPlayerId}
        playerA={player}
        playerB={opponent}
        battleExperienceSummary={board.battleExperienceSummary}
        battleExperienceCardLookup={board.battleExperienceCardLookup}
        isBattleExperiencePending={board.isBattleExperiencePending}
        rewardSummary={screen.duelResultRewardSummary}
        resultActionLabel={resultActionLabel}
        onResultAction={onResultAction}
        onRestart={board.restartMatch}
      />
    </div>
  );
}
