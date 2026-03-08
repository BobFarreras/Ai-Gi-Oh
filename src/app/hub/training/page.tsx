// src/app/hub/training/page.tsx - Simulador de entrenamiento que usa mazo persistido del jugador autenticado cuando está disponible.
import { Board } from "@/components/game/board";
import { HubSectionEntryBurst } from "@/components/hub/sections/HubSectionEntryBurst";
import { getPlayerBoardLoadout } from "@/services/game/get-player-board-deck";

export default async function TrainingPage() {
  const loadout = await getPlayerBoardLoadout();
  return (
    <main className="min-h-screen bg-zinc-950">
      <HubSectionEntryBurst />
      <Board mode="TRAINING" initialPlayerDeck={loadout.deck} initialConfig={{ playerFusionDeck: loadout.fusionDeck }} />
    </main>
  );
}
