// src/app/hub/training/tutorial/TrainingTutorialClient.tsx - Orquesta tutorial board y sincroniza su finalización cuando el jugador gana.
"use client";
import { useMemo, useRef, useState } from "react";
import { Board } from "@/components/game/board";
import { ICard } from "@/core/entities/ICard";
import { postTutorialNodeCompletion } from "@/app/hub/tutorial/internal/tutorial-node-progress-client";
import { TrainingCoinTossOverlay } from "./TrainingCoinTossOverlay";
import { createTutorialOpponentStrategy } from "@/app/hub/training/tutorial/internal/create-tutorial-opponent-strategy";

interface ITrainingTutorialClientProps {
  deck: ICard[];
  fusionDeck: ICard[];
  opponentDeck: ICard[];
  opponentFusionDeck: ICard[];
  seed: string;
}

export function TrainingTutorialClient(props: ITrainingTutorialClientProps) {
  const tutorialOpponentStrategy = useMemo(() => createTutorialOpponentStrategy(), []);
  const hasPostedRef = useRef(false);
  const [status, setStatus] = useState<string | null>(null);
  const [isCoinTossVisible, setIsCoinTossVisible] = useState(true);
  const starterSide: "PLAYER" | "OPPONENT" = "PLAYER";

  async function handleMatchResolved(result: { winnerPlayerId: string | "DRAW"; playerId: string }) {
    if (result.winnerPlayerId !== result.playerId || hasPostedRef.current) {
      if (result.winnerPlayerId !== result.playerId) setStatus("Tutorial no completado. Vuelve a intentarlo.");
      return;
    }
    hasPostedRef.current = true;
    setStatus("Registrando progreso del nodo de combate...");
    try {
      await postTutorialNodeCompletion("tutorial-combat-basics");
      setStatus("Nodo de combate completado y sincronizado.");
    } catch {
      setStatus("No se pudo sincronizar el nodo de combate.");
      hasPostedRef.current = false;
    }
  }

  return (
    <div className="relative h-screen overflow-hidden bg-zinc-950">
      {status ? <p className="absolute left-3 top-3 z-[320] rounded-md bg-cyan-950/80 px-3 py-2 text-xs font-bold text-cyan-100">{status}</p> : null}
      <Board
        mode="TUTORIAL"
        initialPlayerDeck={props.deck}
        initialConfig={{
          playerFusionDeck: props.fusionDeck,
          opponentDeck: props.opponentDeck,
          opponentFusionDeck: props.opponentFusionDeck,
          opponentName: "BigLog",
          starterPlayerId: starterSide === "PLAYER" ? "player-local" : "opponent-local",
          seed: props.seed,
          preserveDeckOrder: true,
          openingHandSize: 4,
        }}
        playerAvatarUrl="/assets/story/player/bob.png"
        opponentAvatarUrl="/assets/story/opponents/opp-ch1-biglog/avatar-BigLog.png"
        isMatchStartLocked={isCoinTossVisible}
        isTurnTimerEnabled={false}
        suppressCombatFeedback={false}
        suppressCombatBanners={false}
        opponentStrategyOverride={tutorialOpponentStrategy}
        resultActionLabel="Volver a selección"
        onResultAction={() => window.location.replace("/hub/training")}
        onExitMatch={() => window.location.replace("/hub/training")}
        onMatchResolved={handleMatchResolved}
      />
      <TrainingCoinTossOverlay
        isVisible={isCoinTossVisible}
        starterSide={starterSide}
        onContinue={() => setIsCoinTossVisible(false)}
      />
    </div>
  );
}
