// src/app/hub/training/arena/page.tsx - Ejecuta combates del modo entrenamiento progresivo con mazo del jugador.
import { Board } from "@/components/game/board";
import { HubSectionEntryBurst } from "@/components/hub/sections/HubSectionEntryBurst";
import { TrainingDeckReadyGate } from "@/components/hub/training/TrainingDeckReadyGate";
import { HOME_DECK_SIZE } from "@/core/services/home/deck-rules";
import { getPlayerBoardLoadout } from "@/services/game/get-player-board-deck";

export default async function TrainingArenaPage() {
  const loadout = await getPlayerBoardLoadout();
  const isDeckReady = Boolean(loadout.deck && loadout.deck.length === HOME_DECK_SIZE);
  if (!isDeckReady) {
    return (
      <>
        <HubSectionEntryBurst />
        <TrainingDeckReadyGate />
      </>
    );
  }
  return (
    <main className="min-h-screen bg-zinc-950">
      <HubSectionEntryBurst />
      <Board mode="TRAINING" initialPlayerDeck={loadout.deck} initialConfig={{ playerFusionDeck: loadout.fusionDeck }} />
    </main>
  );
}
