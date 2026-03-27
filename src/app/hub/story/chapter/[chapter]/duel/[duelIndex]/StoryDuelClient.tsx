// src/app/hub/story/chapter/[chapter]/duel/[duelIndex]/StoryDuelClient.tsx - Orquesta duelo Story en cliente y registra resultado/recompensas al finalizar.
"use client";
import { useMemo, useRef, useState } from "react";
import { Board, BoardBossThemeVariant } from "@/components/game/board";
import { IDuelResultRewardSummary } from "@/components/game/board/ui/internal/duel-result/duel-result-reward-summary";
import { ICard } from "@/core/entities/ICard";
import { IStoryAiProfile } from "@/core/services/opponent/difficulty/story-ai-profile";
import { HeuristicOpponentStrategy } from "@/core/services/opponent/HeuristicOpponentStrategy";
import { mapStoryDifficultyToOpponentDifficulty } from "@/core/services/opponent/difficulty/map-story-difficulty-to-opponent";
import { StoryOpponentDifficulty } from "@/core/entities/opponent/IStoryDuelDefinition";
import { StoryDuelOutcome } from "@/services/story/duel-flow/story-duel-outcome";
import { buildStoryOpponentNarrationPack } from "@/services/story/build-story-opponent-narration-pack";
import { resolveStoryCoinToss } from "@/services/story/duel-flow/resolve-story-coin-toss";
import { postStoryDuelCompletion } from "./story-duel-completion-client";
import { StoryDuelCoinTossOverlay } from "./StoryDuelCoinTossOverlay";
import { useStoryBossSoundtrack } from "./use-story-boss-soundtrack";
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
}
export function StoryDuelClient(props: StoryDuelClientProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [rewardSummary, setRewardSummary] = useState<IDuelResultRewardSummary | null>(null);
  const [resultTransition, setResultTransition] = useState<{ outcome: StoryDuelOutcome; duelNodeId: string; returnNodeId: string } | null>(null);
  const [isCoinTossVisible, setIsCoinTossVisible] = useState(true);
  const [isBossSoundtrackStopped, setIsBossSoundtrackStopped] = useState(false);
  const hasPostedResultRef = useRef(false);
  const playerAvatarUrl = "/assets/story/player/bob.png";
  const resolvedOpponentAvatarUrl = props.opponentAvatarUrl ?? "/assets/story/opponents/opp-ch1-apprentice/avatar-GenNvim.png";
  const [coinToss] = useState(() =>
    resolveStoryCoinToss({
      playerId: props.playerId,
      opponentId: props.opponentId,
    }),
  );
  const narrationPack = useMemo(
    () => buildStoryOpponentNarrationPack({ opponentId: props.opponentId, opponentName: props.opponentName, duelDescription: props.duelDescription }),
    [props.duelDescription, props.opponentId, props.opponentName],
  );
  const bossThemeVariant = useMemo<BoardBossThemeVariant>(() => {
    const byOpponentId: Record<string, BoardBossThemeVariant> = {
      "opp-ch1-helena": "CRIMSON",
      "opp-ch2-omega": "VIOLET",
    };
    return byOpponentId[props.opponentId] ?? "CRIMSON";
  }, [props.opponentId]);
  useStoryBossSoundtrack({
    isBossDuel: props.isBossDuel,
    isBlockedByOverlay: isCoinTossVisible,
    isStopped: isBossSoundtrackStopped,
  });
  const opponentStrategy = useMemo(
    () => new HeuristicOpponentStrategy({ difficulty: mapStoryDifficultyToOpponentDifficulty(props.opponentDifficulty), aiProfile: props.opponentAiProfile }),
    [props.opponentDifficulty, props.opponentAiProfile],
  );
  const pushBackToStory = (input: { outcome: StoryDuelOutcome; duelNodeId: string; returnNodeId: string }) => {
    const query = new URLSearchParams({
      duelOutcome: input.outcome,
      duelNodeId: input.duelNodeId,
      returnNodeId: input.returnNodeId,
      hardReload: Date.now().toString(),
    });
    window.location.replace(`/hub/story?${query.toString()}`);
  };
  const handleResultAction = () => pushBackToStory(
    resultTransition ?? { outcome: "LOST", duelNodeId: `story-ch${props.chapter}-duel-${props.duelIndex}`, returnNodeId: "story-ch1-player-start" },
  );
  async function handleMatchResolved(result: { winnerPlayerId: string | "DRAW"; playerId: string }) {
    if (hasPostedResultRef.current) return;
    hasPostedResultRef.current = true;
    setIsBossSoundtrackStopped(true);
    const outcome: StoryDuelOutcome = result.winnerPlayerId === result.playerId ? "WON" : "LOST";
    setStatus(outcome === "WON" ? "Registrando victoria y recompensas..." : "Registrando derrota...");
    try {
      const payload = await postStoryDuelCompletion({ chapter: props.chapter, duelIndex: props.duelIndex, outcome });
      setResultTransition({ outcome, duelNodeId: payload.duelNodeId, returnNodeId: payload.returnNodeId });
      setRewardSummary({
        rewardNexus: payload.rewardNexus,
        rewardPlayerExperience: payload.rewardPlayerExperience,
        rewardCards: payload.rewardCards,
      });
      setStatus("Resultado Story sincronizado.");
    } catch {
      setStatus("No se pudo registrar el resultado Story.");
      hasPostedResultRef.current = false;
      return;
    }
  }
  async function handleAbortMatch() {
    if (hasPostedResultRef.current) return;
    hasPostedResultRef.current = true;
    setIsBossSoundtrackStopped(true);
    setStatus("Sincronizando abandono y retorno al mapa Story...");
    try {
      const payload = await postStoryDuelCompletion({
        chapter: props.chapter,
        duelIndex: props.duelIndex,
        outcome: "ABANDONED",
      });
      pushBackToStory({ outcome: "ABANDONED", duelNodeId: payload.duelNodeId, returnNodeId: payload.returnNodeId });
    } catch {
      hasPostedResultRef.current = false;
      setStatus("No se pudo sincronizar el abandono Story.");
    }
  }
  return (
    <main className="min-h-screen bg-zinc-950">
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
          starterPlayerId: coinToss.starterPlayerId,
          openingHandSize: 4,
        }}
        opponentAvatarUrl={resolvedOpponentAvatarUrl}
        playerAvatarUrl={playerAvatarUrl}
        isBossTheme={props.isBossDuel}
        bossThemeVariant={bossThemeVariant}
        opponentStrategyOverride={opponentStrategy}
        narrationPack={narrationPack}
        isMatchStartLocked={isCoinTossVisible}
        duelResultRewardSummary={rewardSummary}
        resultActionLabel="Volver al mapa Story"
        onResultAction={handleResultAction}
        onExitMatch={() => void handleAbortMatch()}
        onMatchResolved={handleMatchResolved}
      />
      <StoryDuelCoinTossOverlay
        isVisible={isCoinTossVisible}
        starterSide={coinToss.starterSide}
        playerName={props.playerName}
        opponentName={props.opponentName}
        playerAvatarUrl={playerAvatarUrl}
        opponentAvatarUrl={resolvedOpponentAvatarUrl}
        onComplete={() => setIsCoinTossVisible(false)}
      />
    </main>
  );
}
