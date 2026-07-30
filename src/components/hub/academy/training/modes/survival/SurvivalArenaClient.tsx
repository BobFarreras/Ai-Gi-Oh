// src/components/hub/academy/training/modes/survival/SurvivalArenaClient.tsx - Conecta lobby, Board y liquidación autoritativa de Supervivencia.
"use client";
import { useMemo } from "react";
import { Board } from "@/components/game/board";
import { LocalActionEmitterProvider } from "@/components/game/board/multiplayer/local-action-emitter";
import { HeuristicOpponentStrategy } from "@/core/services/opponent/HeuristicOpponentStrategy";
import { ACADEMY_TRAINING_ARENA_ROUTE } from "@/core/constants/routes/academy-routes";
import { SurvivalLobby } from "./internal/SurvivalLobby";
import { useSurvivalExpedition } from "./useSurvivalExpedition";

const SURVIVAL_SOUNDTRACK = "/audio/survival/pulso-de-neon.m4a";

export function SurvivalArenaClient() {
  const expedition = useSurvivalExpedition();
  const opponentStrategy = useMemo(
    () => new HeuristicOpponentStrategy({ difficulty: "BOSS" }),
    [],
  );
  if (!expedition.battle) {
    return (
      <SurvivalLobby
        run={expedition.run}
        isLoading={expedition.isLoading}
        error={expedition.error}
        onStart={expedition.enterBattle}
      />
    );
  }
  const isRunActive = expedition.run?.status !== "COMPLETED_DEFEAT";
  const isValidated = expedition.reward !== null;
  const rewardSummary = expedition.reward
    ? {
        rewardNexus: expedition.reward.nexus,
        rewardPlayerExperience: expedition.reward.playerExperience,
        rewardCards: [],
      }
    : null;
  return (
    <LocalActionEmitterProvider value={expedition.recordAction}>
      <Board
        key={expedition.battle.battle.battleId}
        mode="SURVIVAL"
        authoritativeInitialState={expedition.battle.initialState}
        opponentStrategyOverride={opponentStrategy}
        playerAvatarUrl="/assets/story/player/bob.webp"
        isBossTheme
        bossThemeVariant="CYAN"
        customSoundtrackPath={SURVIVAL_SOUNDTRACK}
        duelResultRewardSummary={rewardSummary}
        resultActionLabel={!isValidated ? "Validar resultado" : isRunActive ? "Siguiente combate" : "Finalizar expedición"}
        onResultAction={() => {
          if (!isValidated) void expedition.completeBattle();
          else if (isRunActive) void expedition.enterBattle();
          else window.location.replace(ACADEMY_TRAINING_ARENA_ROUTE);
        }}
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
