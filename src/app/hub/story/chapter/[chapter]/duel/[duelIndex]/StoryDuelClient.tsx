// src/app/hub/story/chapter/[chapter]/duel/[duelIndex]/StoryDuelClient.tsx - Orquesta duelo Story en cliente y registra resultado/recompensas al finalizar.
"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Board } from "@/components/game/board";
import { ICard } from "@/core/entities/ICard";

interface StoryDuelClientProps {
  chapter: number;
  duelIndex: number;
  duelTitle: string;
  playerId: string;
  playerName: string;
  opponentId: string;
  opponentName: string;
  playerDeck: ICard[];
  opponentDeck: ICard[];
}

export function StoryDuelClient(props: StoryDuelClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const hasPostedResultRef = useRef(false);

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
    setStatus("Resultado Story sincronizado.");
    setTimeout(() => {
      router.push("/hub/story");
      router.refresh();
    }, 1000);
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
          opponentId: props.opponentId,
          opponentName: props.opponentName,
          opponentDeck: props.opponentDeck,
          starterPlayerId: props.playerId,
          openingHandSize: 4,
        }}
        onMatchResolved={handleMatchResolved}
      />
      <p className="absolute right-4 top-4 z-[500] rounded-md border border-cyan-300/35 bg-slate-950/80 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-cyan-100">
        {props.duelTitle}
      </p>
    </main>
  );
}
