// src/components/game/board/index.tsx - Componente principal del tablero con capas visuales y control de interacción.
"use client";
import { useBoard } from "./hooks/useBoard";
import { DuelResultOverlay } from "./ui/DuelResultOverlay";
import { ICard } from "@/core/entities/ICard";
import { IMatchMode } from "@/core/entities/match";
import { ICreateInitialBoardStateInput } from "@/components/game/board/hooks/internal/boardInitialState";
import { IDuelResultRewardSummary } from "./ui/internal/duel-result/duel-result-reward-summary";
import { IMatchNarrationPack } from "./narration/types";
import { IOpponentStrategy } from "@/core/services/opponent/types";
import { useBoardViewportMode } from "./hooks/internal/layout/use-board-viewport-mode";
import { countRender } from "@/services/performance/dev-performance-telemetry";
import { useBoardScreenState } from "@/components/game/board/internal/use-board-screen-state";
import { BoardStatusAndTopBarSection } from "@/components/game/board/internal/BoardStatusAndTopBarSection";
import { BoardPlayersSection } from "@/components/game/board/internal/BoardPlayersSection";
import { BoardActionControlsSection } from "@/components/game/board/internal/BoardActionControlsSection";
import { BoardInteractiveSection } from "@/components/game/board/internal/BoardInteractiveSection";
import { useBoardPerformanceProfile } from "@/components/game/board/internal/use-board-performance-profile";
import { BoardTutorialFlowOverlay } from "@/components/game/board/internal/BoardTutorialFlowOverlay";
import { ReactiveTrapDecisionTimer } from "@/components/game/board/multiplayer/ReactiveTrapDecisionTimer";
import { MulliganOverlay } from "@/components/game/board/ui/overlays/MulliganOverlay";
import { MAX_PAUSED_TURNS_MULTIPLAYER } from "@/components/game/board/multiplayer/pause-turn-limit";
import { useCallback, useLayoutEffect } from "react";
import { useBoardViewportMetrics } from "./hooks/internal/layout/use-board-viewport-metrics";
import { GameState } from "@/core/use-cases/GameEngine";
import { resolveBoardThemeClasses } from "./internal/resolve-board-theme-classes";

export type BoardBossThemeVariant = "CRIMSON" | "AMBER" | "VIOLET" | "CYAN";

interface IBoardProps {
  initialPlayerDeck?: ICard[] | null;
  mode?: IMatchMode;
  initialConfig?: ICreateInitialBoardStateInput;
  duelResultRewardSummary?: IDuelResultRewardSummary | null;
  narrationPack?: IMatchNarrationPack | null;
  playerAvatarUrl?: string | null;
  opponentAvatarUrl?: string | null;
  opponentAvatarObjectPosition?: string;
  isBossTheme?: boolean;
  bossThemeVariant?: BoardBossThemeVariant;
  resultActionLabel?: string;
  onResultAction?: () => void;
  onExitMatch?: () => void;
  /** Solo Story: Nexus perdido al abandonar el combate (aviso del menú de pausa). */
  abandonPenaltyNexus?: number;
  isMatchStartLocked?: boolean;
  disableOpponentAutomation?: boolean;
  isTurnTimerEnabled?: boolean;
  suppressCombatFeedback?: boolean;
  suppressCombatBanners?: boolean;
  opponentStrategyOverride?: IOpponentStrategy | null;
  onMatchResolved?: (result: { winnerPlayerId: string | "DRAW"; playerId: string; mode: IMatchMode; matchSeed: string; flawless: boolean; passiveNexusEarned: number }) => void;
  onTutorialFlowFinished?: () => void;
  /**
   * Ganador comunicado por una fuente externa al motor local (ej. notificación
   * Realtime de fin de partida en multijugador). Tiene prioridad cuando el motor
   * local aún no ha detectado el fin (latencia/pérdida de la acción final),
   * garantizando que el overlay de resultado se muestre al perdedor.
   */
  externalWinnerPlayerId?: string | "DRAW" | null;
  /**
   * Multijugador: el jugador local pierde por permanecer demasiados turnos en pausa (anti-AFK). El cliente
   * lo traduce en victoria del rival (finish + overlay de derrota local). Ver MAX_PAUSED_TURNS_MULTIPLAYER.
   */
  onLocalForfeit?: () => void;
  /** PvE: habilita el overlay de mulligan de apertura (habilidad OPENING_MULLIGAN del árbol). */
  enableOpeningMulligan?: boolean;
  /** Snapshot firmado por el servidor para modos autoritativos. */
  authoritativeInitialState?: GameState | null;
  /** Soundtrack alternativo del modo; comparte mute, pausa y ciclo de vida con el tablero. */
  customSoundtrackPath?: string | null;
  /** Callback que recibe applyTransition al montar el Board. Permite que clientes externos (ej. multijugador) apliquen acciones al estado de partida. */
  applyTransitionRef?: React.MutableRefObject<((transition: (state: import("@/core/use-cases/GameEngine").GameState) => import("@/core/use-cases/GameEngine").GameState) => import("@/core/use-cases/GameEngine").GameState | null) | null>;
  /** Recibe applyRemoteAction: aplica una acción del rival CON su coreografía visual (multijugador). */
  applyRemoteActionRef?: React.MutableRefObject<((action: import("@/core/entities/multiplayer/IMatchAction").IMatchActionPayload) => Promise<void>) | null>;
}
export function Board({ initialPlayerDeck, mode = "TRAINING", initialConfig, duelResultRewardSummary, narrationPack, playerAvatarUrl = null, opponentAvatarUrl = null, opponentAvatarObjectPosition, isBossTheme = false, bossThemeVariant = "CRIMSON", resultActionLabel, onResultAction, onExitMatch, abandonPenaltyNexus = 0, isMatchStartLocked = false, disableOpponentAutomation = false, isTurnTimerEnabled = true, suppressCombatFeedback = false, suppressCombatBanners = false, opponentStrategyOverride = null, onMatchResolved, onTutorialFlowFinished, applyTransitionRef, applyRemoteActionRef, externalWinnerPlayerId, onLocalForfeit, enableOpeningMulligan = false, authoritativeInitialState = null, customSoundtrackPath = null }: IBoardProps) {
  countRender("Board");
  const board = useBoard({
    initialPlayerDeck: initialPlayerDeck ?? undefined,
    mode,
    initialConfig,
    isMatchStartLocked,
    // El tema de jefe sustituye la banda sonora base por la suya.
    disableBaseSoundtrack: isBossTheme,
    disableOpponentAutomation,
    opponentStrategyOverride,
    enableOpeningMulligan,
    authoritativeInitialState,
    customSoundtrackPath,
  });
  useLayoutEffect(() => {
    if (applyTransitionRef) applyTransitionRef.current = board.applyTransition;
    if (applyRemoteActionRef) applyRemoteActionRef.current = board.applyRemoteAction;
  });
  const player = board.gameState.playerA; const opponent = board.gameState.playerB;
  const { isMobile } = useBoardViewportMode();
  const { shouldReduceCombatEffects } = useBoardPerformanceProfile();
  const viewportMetrics = useBoardViewportMetrics();
  const bossThemeClassName = isBossTheme ? `board-boss-theme board-boss-theme--${bossThemeVariant.toLowerCase()}` : "";
  // Base CSS `h-dvh` (correcta en SSR y sin JS); el visualViewport afina el px exacto tras montar.
  const boardRootClassName = `board-space-bg relative w-full h-dvh overflow-hidden font-sans cursor-crosshair ${bossThemeClassName} ${shouldReduceCombatEffects ? "reduced-combat-effects" : ""}`;
  const boardThemeClasses = resolveBoardThemeClasses(isBossTheme, bossThemeVariant);
  const screen = useBoardScreenState({
    board,
    mode,
    playerId: player.id,
    playerName: player.name,
    opponentId: opponent.id,
    opponentName: opponent.name,
    playerGraveyard: player.graveyard,
    opponentGraveyard: opponent.graveyard,
    playerFusionDeck: player.fusionDeck ?? [],
    opponentFusionDeck: opponent.fusionDeck ?? [],
    playerDestroyed: player.destroyedPile ?? [],
    opponentDestroyed: opponent.destroyedPile ?? [],
    playerActiveEntities: player.activeEntities,
    playerActiveExecutions: player.activeExecutions,
    duelResultRewardSummary,
    narrationPack,
    isNarrationLocked: isMatchStartLocked,
    onMatchResolved,
    externalWinnerPlayerId,
  });
  const isMultiplayer = mode === "MULTIPLAYER";
  // Timeout de turno. En multi, si el jugador está en pausa cuenta como "turno pausado" (anti-AFK): al llegar
  // al límite pierde (forfeit → victoria del rival); en caso contrario, cede el turno entero al rival.
  const handleTurnTimeout = useCallback(() => {
    board.playTimerExpired();
    if (isMultiplayer && board.isPaused) {
      const pausedTurns = board.registerPausedTurnTimeout();
      if (pausedTurns >= MAX_PAUSED_TURNS_MULTIPLAYER) {
        onLocalForfeit?.();
        return;
      }
    }
    board.handleTimerExpired();
  }, [board, isMultiplayer, onLocalForfeit]);
  return (
    <div className={boardRootClassName} style={viewportMetrics.height ? { height: `${viewportMetrics.height}px` } : undefined} onClick={board.clearSelection}>
      <div className={boardThemeClasses.ambient} />
      <div className={boardThemeClasses.vignette} />
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
            abandonPenaltyNexus={abandonPenaltyNexus}
            isTurnTimerEnabled={isTurnTimerEnabled}
            suppressCombatBanners={suppressCombatBanners}
            isMultiplayer={isMultiplayer}
            onTurnTimeout={handleTurnTimeout}
            pausedTurnsUsed={board.pausedTurnTimeouts}
          />
          <BoardPlayersSection
            board={board}
            screen={screen}
            isMobile={isMobile}
            player={player}
            opponent={opponent}
            playerAvatarUrl={playerAvatarUrl}
            opponentAvatarUrl={opponentAvatarUrl}
            opponentAvatarObjectPosition={opponentAvatarObjectPosition}
          />
        </>
      ) : null}
      <BoardInteractiveSection
        board={board}
        screen={screen}
        isMobile={isMobile}
        suppressCombatFeedback={suppressCombatFeedback}
      />
      {/* Ficha 4 (multi): banner + contador de la decisión de trampa reactiva (defensor decide / atacante espera).
          El `key` ligado a la pausa remonta el contador en cada ataque nuevo, reiniciando la cuenta atrás. */}
      <ReactiveTrapDecisionTimer
        key={
          board.gameState.pendingReactiveTrapDecision
            ? `${board.gameState.pendingReactiveTrapDecision.attackerInstanceId}:${board.gameState.pendingReactiveTrapDecision.defenderPlayerId}`
            : "trap-timer-idle"
        }
        pending={board.gameState.pendingReactiveTrapDecision}
        localPlayerId={player.id}
      />
      {/* Ficha 8 (PvE): overlay de mulligan de apertura, solo si el jugador tiene la habilidad y no ha decidido. */}
      {board.mulligan.isPending ? (
        <MulliganOverlay
          reshuffled={board.mulligan.reshuffled}
          onReshuffle={board.mulligan.reshuffle}
          onKeep={board.mulligan.keep}
        />
      ) : null}
      {mode === "TUTORIAL" && !isMatchStartLocked ? (
        <BoardTutorialFlowOverlay
          combatLog={board.gameState.combatLog}
          selectedCardId={board.selectedCard?.id ?? null}
          hasPendingTrapPrompt={Boolean(board.pendingTrapActivationPrompt)}
          phase={board.gameState.phase}
          isGraveyardOpen={Boolean(screen.effectiveGraveyardView)}
          isFusionCinematicActive={board.isFusionCinematicActive}
          fusionSelectedCount={board.pendingFusionSelectedEntityIds.length}
          isFusionBrowserOpen={board.gameState.pendingTurnAction?.type === "SELECT_FUSION_MATERIALS"}
          hasWinner={Boolean(board.winnerPlayerId)}
          onFlowFinished={onTutorialFlowFinished}
        />
      ) : null}
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
        winnerPlayerId={screen.resultWinnerPlayerId}
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
