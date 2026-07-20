// src/app/hub/story/chapter/[chapter]/duel/[duelIndex]/StoryDuelClient.tsx - Orquesta duelo Story en cliente y registra resultado/recompensas al finalizar.
"use client";
import { useMemo, useState } from "react";
import { Board } from "@/components/game/board";
import { ICard } from "@/core/entities/ICard";
import { StoryOpponentDifficulty } from "@/core/entities/opponent/IStoryDuelDefinition";
import { IStoryAiProfile } from "@/core/services/opponent/difficulty/story-ai-profile";
import {
  createStoryDuelCoinToss,
  createStoryDuelNarrationPack,
  createStoryDuelOpponentStrategy,
  createStoryDuelPresentationRuntime,
} from "./internal/story-duel-runtime";
import { STORY_DEFEAT_NEXUS_PENALTY } from "@/services/story/duel-flow/story-defeat-penalty";
import { useStoryDuelResultSync } from "./internal/use-story-duel-result-sync";
import { StoryDuelCoinTossOverlay } from "./StoryDuelCoinTossOverlay";
import { useStoryBossSoundtrack } from "./use-story-boss-soundtrack";
import { track } from "@/services/analytics/client/analytics-buffer";

interface StoryDuelClientProps {
  chapter: number;
  duelIndex: number;
  duelTitle: string;
  duelDescription: string;
  isBossDuel: boolean;
  playerId: string;
  playerName: string;
  opponentId: string;
  opponentName: string;
  opponentAvatarUrl?: string | null;
  opponentDifficulty: StoryOpponentDifficulty;
  opponentAiProfile: IStoryAiProfile;
  playerDeck: ICard[];
  playerFusionDeck: ICard[];
  opponentDeck: ICard[];
  opponentFusionDeck: ICard[];
  completionTicket: string;
  returnBasePath?: string;
  resultActionLabel?: string;
  playerStartingLpBonus?: number;
  playerMaxEnergyBonus?: number;
  playerTurn1EnergyBonus?: number;
  playerOpeningMulligan?: boolean;
}

export function StoryDuelClient(props: StoryDuelClientProps) {
  const [isCoinTossVisible, setIsCoinTossVisible] = useState(true);
  const {
    status,
    rewardSummary,
    isBossSoundtrackStopped,
    handleResultAction,
    handleMatchResolved,
    handleAbortMatch,
  } = useStoryDuelResultSync({
    chapter: props.chapter,
    duelIndex: props.duelIndex,
    completionTicket: props.completionTicket,
    returnBasePath: props.returnBasePath,
  });
  const presentationRuntime = useMemo(
    () => createStoryDuelPresentationRuntime(props.opponentId, props.opponentAvatarUrl),
    [props.opponentAvatarUrl, props.opponentId],
  );
  const [coinToss] = useState(() =>
    createStoryDuelCoinToss({
      playerId: props.playerId,
      opponentId: props.opponentId,
    }),
  );
  const narrationPack = useMemo(
    () =>
      createStoryDuelNarrationPack({
        opponentId: props.opponentId,
        opponentName: props.opponentName,
        duelDescription: props.duelDescription,
      }),
    [props.duelDescription, props.opponentId, props.opponentName],
  );
  useStoryBossSoundtrack({
    isBossDuel: props.isBossDuel,
    isBlockedByOverlay: isCoinTossVisible,
    isStopped: isBossSoundtrackStopped,
  });
  const opponentStrategy = useMemo(
    () =>
      createStoryDuelOpponentStrategy(
        props.opponentDifficulty,
        props.opponentAiProfile,
      ),
    [props.opponentDifficulty, props.opponentAiProfile],
  );

  return (
    <main className="min-h-dvh bg-zinc-950">
      {status ? <p className="absolute left-4 top-4 z-[500] rounded-md bg-cyan-950/80 px-3 py-2 text-xs font-bold text-cyan-100">{status}</p> : null}
      <Board
        mode="STORY"
        initialPlayerDeck={props.playerDeck}
        initialConfig={{
          playerId: props.playerId,
          playerName: props.playerName,
          playerFusionDeck: props.playerFusionDeck,
          opponentId: props.opponentId,
          opponentName: props.opponentName,
          opponentDeck: props.opponentDeck,
          opponentFusionDeck: props.opponentFusionDeck,
          starterPlayerId: coinToss.starterPlayerId,
          openingHandSize: 4,
          playerStartingLpBonus: props.playerStartingLpBonus,
          playerMaxEnergyBonus: props.playerMaxEnergyBonus,
          playerTurn1EnergyBonus: props.playerTurn1EnergyBonus,
        }}
        opponentAvatarUrl={presentationRuntime.opponentAvatarUrl}
        playerAvatarUrl={presentationRuntime.playerAvatarUrl}
        isBossTheme={props.isBossDuel}
        bossThemeVariant={presentationRuntime.bossThemeVariant}
        opponentStrategyOverride={opponentStrategy}
        narrationPack={narrationPack}
        isMatchStartLocked={isCoinTossVisible}
        enableOpeningMulligan={props.playerOpeningMulligan}
        duelResultRewardSummary={rewardSummary}
        resultActionLabel={props.resultActionLabel ?? "Volver al mapa Story"}
        onResultAction={handleResultAction}
        onExitMatch={() => void handleAbortMatch()}
        abandonPenaltyNexus={STORY_DEFEAT_NEXUS_PENALTY}
        onMatchResolved={handleMatchResolved}
      />
      <StoryDuelCoinTossOverlay
        isVisible={isCoinTossVisible}
        starterSide={coinToss.starterSide}
        playerName={props.playerName}
        opponentName={props.opponentName}
        playerAvatarUrl={presentationRuntime.playerAvatarUrl}
        opponentAvatarUrl={presentationRuntime.opponentAvatarUrl}
        onComplete={() => {
          setIsCoinTossVisible(false);
          track("duel_started", "gameplay", { mode: "STORY", chapter: props.chapter, duelIndex: props.duelIndex, isBossDuel: props.isBossDuel });
        }}
      />
    </main>
  );
}
