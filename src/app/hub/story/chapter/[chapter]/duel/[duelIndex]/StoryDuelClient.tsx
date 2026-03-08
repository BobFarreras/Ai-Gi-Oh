// src/app/hub/story/chapter/[chapter]/duel/[duelIndex]/StoryDuelClient.tsx - Orquesta duelo Story en cliente y registra resultado/recompensas al finalizar.
"use client";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Board } from "@/components/game/board";
import { IDuelResultRewardSummary } from "@/components/game/board/ui/internal/duel-result-reward-summary";
import { ICard } from "@/core/entities/ICard";
import { buildStoryOpponentNarrationPack } from "@/services/story/build-story-opponent-narration-pack";

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
  const hasPostedResultRef = useRef(false);
  const playerAvatarUrl = "/assets/story/player/bob.png";
  const resolvedOpponentAvatarUrl = props.opponentAvatarUrl ?? "/assets/story/opponents/opp-ch1-apprentice/avatar-GenNvim.png";
  const narrationPack = useMemo(
    () => buildStoryOpponentNarrationPack({ opponentId: props.opponentId, opponentName: props.opponentName, duelDescription: props.duelDescription }),
    [props.duelDescription, props.opponentId, props.opponentName],
  );

  async function handleMatchResolved(result: { winnerPlayerId: string | "DRAW"; playerId: string }) {
    if (hasPostedResultRef.current) return;
    hasPostedResultRef.current = true;
    const didWin = result.winnerPlayerId === result.playerId;
    setStatus(didWin ? "Registrando victoria y recompensas..." : "Registrando derrota...");
    const response = await fetch("/api/story/duels/complete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ chapter: props.chapter, duelIndex: props.duelIndex, didWin }),
    });
    if (!response.ok) {
      setStatus("No se pudo registrar el resultado Story.");
      hasPostedResultRef.current = false;
      return;
    }
    const payload = (await response.json()) as { rewardNexus?: number; rewardPlayerExperience?: number; rewardCards?: ICard[] };
    setRewardSummary({
      rewardNexus: payload.rewardNexus ?? 0,
      rewardPlayerExperience: payload.rewardPlayerExperience ?? 0,
      rewardCards: payload.rewardCards ?? [],
    });
    setStatus("Resultado Story sincronizado.");
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
          starterPlayerId: props.playerId,
          openingHandSize: 4,
        }}
        opponentAvatarUrl={resolvedOpponentAvatarUrl}
        playerAvatarUrl={playerAvatarUrl}
        narrationPack={narrationPack}
        duelResultRewardSummary={rewardSummary}
        resultActionLabel="Volver al mapa Story"
        onResultAction={() => {
          router.push("/hub/story");
          router.refresh();
        }}
        onMatchResolved={handleMatchResolved}
      />
    </main>
  );
}
