// src/components/hub/academy/training/modes/survival/SurvivalArenaClient.tsx - Conecta lobby, Board y liquidación autoritativa de Supervivencia.
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Board } from "@/components/game/board";
import { LocalActionEmitterProvider } from "@/components/game/board/multiplayer/local-action-emitter";
import { HeuristicOpponentStrategy } from "@/core/services/opponent/HeuristicOpponentStrategy";
import { ACADEMY_TRAINING_ARENA_ROUTE } from "@/core/constants/routes/academy-routes";
import { SurvivalLobby } from "./internal/SurvivalLobby";
import { SurvivalDebrief } from "./internal/SurvivalDebrief";
import { useSurvivalExpedition } from "./useSurvivalExpedition";
import { buildStoryOpponentNarrationPack } from "@/services/story/build-story-opponent-narration-pack";
import { primeMusicFromUserGesture } from "@/components/game/board/hooks/internal/audio/audioRuntime";

const SURVIVAL_SOUNDTRACK = "/audio/survival/pulso-de-neon.m4a";

export function SurvivalArenaClient() {
  const expedition = useSurvivalExpedition();
  const { enterBattle } = expedition;
  const [isBattleStarted, setIsBattleStarted] = useState(false);
  const hasPreparedRef = useRef(false);
  const opponentStrategy = useMemo(
    () => new HeuristicOpponentStrategy({ difficulty: "BOSS" }),
    [],
  );
  useEffect(() => {
    if (hasPreparedRef.current) return;
    hasPreparedRef.current = true;
    void enterBattle();
  }, [enterBattle]);
  const narrationPack = useMemo(() => {
    const presentation = expedition.battle?.presentation;
    return presentation
      ? buildStoryOpponentNarrationPack({
          opponentId: presentation.storyOpponentId,
          opponentName: presentation.displayName,
          duelDescription: `Combate de Supervivencia contra ${presentation.displayName}.`,
        })
      : null;
  }, [expedition.battle?.presentation]);
  if (!expedition.battle) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#020b11] text-sm font-black uppercase tracking-[0.22em] text-cyan-200">
        {expedition.error ?? "Sincronizando expedición…"}
      </main>
    );
  }
  if (expedition.settlement) {
    return <SurvivalDebrief
      settlement={expedition.settlement}
      isLoading={expedition.isLoading}
      error={expedition.error}
      onContinue={() => {
        void expedition.enterBattle().then((prepared) => {
          if (prepared) setIsBattleStarted(false);
        });
      }}
      onExit={() => window.location.replace(ACADEMY_TRAINING_ARENA_ROUTE)}
    />;
  }
  if (!isBattleStarted && expedition.run && expedition.progress) {
    return <SurvivalLobby
      run={expedition.run}
      progress={expedition.progress}
      battleIndex={expedition.battle.battle.battleIndex}
      isResumed={expedition.battle.resumed}
      opponentName={expedition.battle.presentation.displayName}
      opponentAvatarUrl={expedition.battle.presentation.avatarUrl}
      error={expedition.error}
      notice={expedition.notice}
      onStart={() => {
        primeMusicFromUserGesture(SURVIVAL_SOUNDTRACK, 0.34);
        setIsBattleStarted(true);
      }}
      onBack={() => window.location.replace(ACADEMY_TRAINING_ARENA_ROUTE)}
    />;
  }
  return (
    <LocalActionEmitterProvider value={expedition.recordAction}>
      <Board
        key={expedition.battle.battle.battleId}
        mode="SURVIVAL"
        authoritativeInitialState={expedition.battle.initialState}
        opponentStrategyOverride={opponentStrategy}
        playerAvatarUrl="/assets/story/player/bob.webp"
        opponentAvatarUrl={expedition.battle.presentation.avatarUrl}
        narrationPack={narrationPack}
        isBossTheme
        bossThemeVariant="CYAN"
        customSoundtrackPath={SURVIVAL_SOUNDTRACK}
        resultActionLabel={expedition.isLoading ? "Validando…" : "Ver informe"}
        onResultAction={() => void expedition.completeBattle()}
        onExitMatch={() => window.location.replace(ACADEMY_TRAINING_ARENA_ROUTE)}
        onMatchResolved={() => void expedition.completeBattle()}
      />
      {expedition.error ? (
        <div role="alert" className="fixed inset-x-4 top-4 z-[200] mx-auto max-w-xl rounded-xl border border-rose-400/50 bg-rose-950/95 p-4 text-center text-sm font-bold text-rose-100">
          {expedition.error}
        </div>
      ) : null}
    </LocalActionEmitterProvider>
  );
}
