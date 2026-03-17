// src/components/game/board/index.tsx - Componente principal del tablero con capas visuales y control de interacción.
"use client";
import { useBoard } from "./hooks/useBoard";
import { DuelResultOverlay } from "./ui/DuelResultOverlay";
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
import { BoardInteractiveSection } from "@/components/game/board/internal/BoardInteractiveSection";
import { useBoardPerformanceProfile } from "@/components/game/board/internal/use-board-performance-profile";

export type BoardBossThemeVariant = "CRIMSON" | "AMBER" | "VIOLET" | "CYAN";

interface IBoardProps {
  initialPlayerDeck?: ICard[] | null;
  mode?: IMatchMode;
  initialConfig?: ICreateInitialBoardStateInput;
  duelResultRewardSummary?: IDuelResultRewardSummary | null;
  narrationPack?: IMatchNarrationPack | null;
  playerAvatarUrl?: string | null;
  opponentAvatarUrl?: string | null;
  isBossTheme?: boolean;
  bossThemeVariant?: BoardBossThemeVariant;
  resultActionLabel?: string;
  onResultAction?: () => void;
  onExitMatch?: () => void;
  isMatchStartLocked?: boolean;
  onMatchResolved?: (result: { winnerPlayerId: string | "DRAW"; playerId: string; mode: IMatchMode; matchSeed: string }) => void;
}
export function Board({ initialPlayerDeck, mode = "TRAINING", initialConfig, duelResultRewardSummary, narrationPack, playerAvatarUrl = null, opponentAvatarUrl = null, isBossTheme = false, bossThemeVariant = "CRIMSON", resultActionLabel, onResultAction, onExitMatch, isMatchStartLocked = false, onMatchResolved }: IBoardProps) {
  countRender("Board");
  const board = useBoard(initialPlayerDeck ?? undefined, mode, initialConfig, isMatchStartLocked, isBossTheme);
  const player = board.gameState.playerA; const opponent = board.gameState.playerB;
  const { isMobile } = useBoardViewportMode();
  const { shouldReduceCombatEffects } = useBoardPerformanceProfile();
  const bossThemeClassName = isBossTheme ? `board-boss-theme board-boss-theme--${bossThemeVariant.toLowerCase()}` : "";
  const boardRootClassName = `board-space-bg relative w-full h-screen overflow-hidden font-sans cursor-crosshair ${bossThemeClassName} ${shouldReduceCombatEffects ? "reduced-combat-effects" : ""}`;
  const boardAmbientClassName = isBossTheme
    ? "absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(244,63,94,0.14),transparent_52%)] pointer-events-none"
    : "absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(34,211,238,0.12),transparent_52%)] pointer-events-none";
  const boardVignetteClassName = isBossTheme
    ? "absolute inset-0 shadow-[inset_0_0_210px_rgba(44,7,16,0.64)] pointer-events-none"
    : "absolute inset-0 shadow-[inset_0_0_200px_rgba(1,4,12,0.58)] pointer-events-none";
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
    isNarrationLocked: isMatchStartLocked,
    onMatchResolved,
  });
  return (
    <div className={boardRootClassName} onClick={board.clearSelection}>
      <div className={boardAmbientClassName} />
      <div className={boardVignetteClassName} />
      {!isMatchStartLocked ? (
        <>
          <BoardStatusAndTopBarSection
            board={board}
            screen={screen}
            isMobile={isMobile}
            player={player}
            opponent={opponent}
            playerAvatarUrl={playerAvatarUrl}
            opponentAvatarUrl={opponentAvatarUrl}
            onExitMatch={onExitMatch}
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
        </>
      ) : null}
      <BoardInteractiveSection board={board} screen={screen} isMobile={isMobile} />
      {!isMatchStartLocked ? (
        <BoardActionControlsSection
          board={board}
          screen={screen}
          isMobile={isMobile}
          player={player}
          opponent={opponent}
          playerAvatarUrl={playerAvatarUrl}
          opponentAvatarUrl={opponentAvatarUrl}
        />
      ) : null}
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
