// src/components/hub/academy/training/modes/olympus/OlympusArenaClient.tsx - Conecta selección, Board y liquidación autoritativa de Olimpo.
"use client";
import { useMemo } from "react";
import { Board } from "@/components/game/board";
import { LocalActionEmitterProvider } from "@/components/game/board/multiplayer/local-action-emitter";
import { HeuristicOpponentStrategy } from "@/core/services/opponent/HeuristicOpponentStrategy";
import { applyMatchAction } from "@/core/services/multiplayer/apply-match-action";
import { replayJournalToState } from "@/core/use-cases/match/replay-journal-to-state";
import { ACADEMY_TRAINING_ARENA_ROUTE } from "@/core/constants/routes/academy-routes";
import { buildStoryOpponentNarrationPack } from "@/services/story/build-story-opponent-narration-pack";
import { primeMusicFromUserGesture } from "@/components/game/board/hooks/internal/audio/audioRuntime";
import { OlympusDebrief } from "./internal/OlympusDebrief";
import { OlympusOverviewScreen } from "./internal/OlympusOverviewScreen";
import { useOlympusMode } from "./useOlympusMode";

const OLYMPUS_SOUNDTRACK = "/audio/survival/pulso-de-neon.m4a";
const exitToArena = () => window.location.replace(ACADEMY_TRAINING_ARENA_ROUTE);

export function OlympusArenaClient() {
  const mode = useOlympusMode();
  const runtime = mode.battle;
  const aiProfile = runtime?.aiProfile;
  const opponentStrategy = useMemo(
    () => (aiProfile ? new HeuristicOpponentStrategy({ difficulty: aiProfile }) : null),
    [aiProfile],
  );

  // Un combate retomado arranca donde se quedó: se reproduce el avance que el servidor registró.
  const resumedInitialState = useMemo(() => {
    if (!runtime || !opponentStrategy) return null;
    if (runtime.journalEntries.length === 0) return runtime.initialState;
    try {
      return replayJournalToState({
        snapshot: runtime.initialState,
        entries: runtime.journalEntries,
        playerId: runtime.session.playerId,
        opponentId: runtime.session.opponentId,
        derivation: { strategy: opponentStrategy },
        applyAction: applyMatchAction,
      });
    } catch {
      return null;
    }
  }, [runtime, opponentStrategy]);

  const narrationPack = useMemo(() => {
    if (!runtime) return null;
    return buildStoryOpponentNarrationPack({
      opponentId: runtime.legend.id,
      opponentName: runtime.legend.displayName,
      duelDescription: `Duelo legendario contra ${runtime.legend.displayName}.`,
    });
  }, [runtime]);

  const returnToSelection = () => {
    mode.dismissBattle();
    void mode.reloadOverview();
  };

  if (mode.settlement && runtime) {
    return (
      <OlympusDebrief
        settlement={mode.settlement}
        legend={runtime.legend}
        attemptsRemaining={mode.overview?.allowance.attemptsRemaining ?? 0}
        isLoading={mode.isLoading}
        onContinue={returnToSelection}
        onExit={exitToArena}
      />
    );
  }

  if (!runtime) {
    return <OlympusOverviewScreen mode={mode} onEnterBattle={(championId, opponentId) => {
      // Confirmar YA es el gesto del usuario: se arranca aquí la pista para caer directo en el tablero,
      // sin una antesala intermedia que el jugador ya ha visto en la pantalla de selección.
      primeMusicFromUserGesture(OLYMPUS_SOUNDTRACK, 0.34);
      void mode.enterBattle(championId, opponentId);
    }} />;
  }

  if (!resumedInitialState) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#0a0513] px-6 text-center text-sm font-black uppercase tracking-[0.18em] text-rose-200">
        No se pudo reconstruir el avance de este combate. Vuelve a Arena e inténtalo de nuevo.
      </main>
    );
  }

  return (
    <LocalActionEmitterProvider value={mode.recordAction}>
      <Board
        key={runtime.battle.battleId}
        mode="OLYMPUS"
        authoritativeInitialState={resumedInitialState}
        opponentStrategyOverride={opponentStrategy}
        playerAvatarUrl={runtime.presentation.championAvatarUrl}
        opponentAvatarUrl={runtime.presentation.legendAvatarUrl}
        narrationPack={narrationPack}
        isBossTheme
        bossThemeVariant="VIOLET"
        customSoundtrackPath={OLYMPUS_SOUNDTRACK}
        resultActionLabel={mode.isLoading ? "Validando…" : "Ver informe"}
        // Pulsar el resultado lleva al informe; resolverse el duelo solo liquida, para que el overlay
        // con la experiencia de las cartas dé tiempo a verse.
        onResultAction={() => void mode.revealSettlement()}
        onExitMatch={exitToArena}
        onMatchResolved={() => void mode.completeBattle()}
      />
      {mode.error ? (
        <div role="alert" className="fixed inset-x-4 top-4 z-[200] mx-auto max-w-xl rounded-xl border border-rose-400/50 bg-rose-950/95 p-4 text-center text-sm font-bold text-rose-100">
          {mode.error}
        </div>
      ) : null}
    </LocalActionEmitterProvider>
  );
}
