// src/app/hub/training/tutorial/TrainingTutorialClient.tsx - Orquesta tutorial board y sincroniza su finalización cuando el jugador gana.
"use client";
import { useRef, useState } from "react";
import { Board } from "@/components/game/board";
import { ICard } from "@/core/entities/ICard";
import { postTrainingTutorialCompletion } from "./training-tutorial-completion-client";

interface ITrainingTutorialClientProps {
  deck: ICard[];
  fusionDeck: ICard[];
}

export function TrainingTutorialClient(props: ITrainingTutorialClientProps) {
  const hasPostedRef = useRef(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleMatchResolved(result: { winnerPlayerId: string | "DRAW"; playerId: string }) {
    if (result.winnerPlayerId !== result.playerId || hasPostedRef.current) {
      if (result.winnerPlayerId !== result.playerId) setStatus("Tutorial no completado. Vuelve a intentarlo.");
      return;
    }
    hasPostedRef.current = true;
    setStatus("Registrando tutorial completado...");
    try {
      await postTrainingTutorialCompletion();
      setStatus("Tutorial completado y sincronizado.");
    } catch {
      setStatus("No se pudo sincronizar el tutorial completado.");
      hasPostedRef.current = false;
    }
  }

  return (
    <main className="relative min-h-screen bg-zinc-950">
      {status ? <p className="absolute left-3 top-3 z-[320] rounded-md bg-cyan-950/80 px-3 py-2 text-xs font-bold text-cyan-100">{status}</p> : null}
      <Board
        mode="TUTORIAL"
        initialPlayerDeck={props.deck}
        initialConfig={{ playerFusionDeck: props.fusionDeck }}
        resultActionLabel="Volver a selección"
        onResultAction={() => window.location.replace("/hub/training")}
        onExitMatch={() => window.location.replace("/hub/training")}
        onMatchResolved={handleMatchResolved}
      />
    </main>
  );
}
