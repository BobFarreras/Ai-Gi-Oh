// src/app/hub/training/page.tsx - Simulador de entrenamiento que usa mazo persistido del jugador autenticado cuando está disponible.
import { Board } from "@/components/game/board";
import { getPlayerBoardDeck } from "@/services/game/get-player-board-deck";

export default async function TrainingPage() {
  const playerDeck = await getPlayerBoardDeck();
  return (
    <main className="min-h-screen bg-zinc-950">
      <Board initialPlayerDeck={playerDeck} />
    </main>
  );
}
