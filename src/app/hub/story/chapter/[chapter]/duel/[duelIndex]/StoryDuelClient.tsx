// src/app/hub/story/chapter/[chapter]/duel/[duelIndex]/StoryDuelClient.tsx - Orquesta duelo Story en cliente y registra resultado/recompensas al finalizar.
"use client";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Board } from "@/components/game/board";
import { IDuelResultRewardSummary } from "@/components/game/board/ui/internal/duel-result/duel-result-reward-summary";
import { ICard } from "@/core/entities/ICard";
import { StoryDuelOutcome } from "@/services/story/duel-flow/story-duel-outcome";
import { buildStoryOpponentNarrationPack } from "@/services/story/build-story-opponent-narration-pack";
import { resolveStoryCoinToss } from "@/services/story/duel-flow/resolve-story-coin-toss";
import { postStoryDuelCompletion } from "./story-duel-completion-client";
import { StoryDuelCoinTossOverlay } from "./StoryDuelCoinTossOverlay";

interface StoryDuelClientProps {
  chapter: number;
  duelIndex: number;
  duelTitle: string;
  duelDescription: string;
  playerId: string;
  playerName: string;
  opponentId: string;
  opponentName: string;
  opponentAvatarUrl?: string | null;
  playerDeck: ICard[];
  playerFusionDeck: ICard[];
  opponentDeck: ICard[];
}

export function StoryDuelClient(props: StoryDuelClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [rewardSummary, setRewardSummary] = useState<IDuelResultRewardSummary | null>(null);
  const [resultTransition, setResultTransition] = useState<{ outcome: StoryDuelOutcome; duelNodeId: string; returnNodeId: string } | null>(null);
  const [isCoinTossVisible, setIsCoinTossVisible] = useState(true);
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
  const pushBackToStory = (input: { outcome: StoryDuelOutcome; duelNodeId: string; returnNodeId: string }) => {
    const query = new URLSearchParams({
      duelOutcome: input.outcome,
      duelNodeId: input.duelNodeId,
      returnNodeId: input.returnNodeId,
    });
    router.push(`/hub/story?${query.toString()}`);
    router.refresh();
  };

  async function handleMatchResolved(result: { winnerPlayerId: string | "DRAW"; playerId: string }) {
    if (hasPostedResultRef.current) return;
    hasPostedResultRef.current = true;
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
        narrationPack={narrationPack}
        isMatchStartLocked={isCoinTossVisible}
        duelResultRewardSummary={rewardSummary}
        resultActionLabel="Volver al mapa Story"
        onResultAction={() => {
          if (resultTransition) {
            pushBackToStory(resultTransition);
            return;
          }
          pushBackToStory({ outcome: "LOST", duelNodeId: `story-ch${props.chapter}-duel-${props.duelIndex}`, returnNodeId: "story-ch1-player-start" });
        }}
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
