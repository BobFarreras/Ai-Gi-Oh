// src/app/hub/training/tutorial/page.tsx - Entry server-side para tutorial de combate con runtime delegado a cliente.
import { HubSectionEntryBurst } from "@/components/hub/sections/HubSectionEntryBurst";
import { TrainingDeckReadyGate } from "@/components/hub/training/TrainingDeckReadyGate";
import { TrainingTutorialClient } from "@/app/hub/training/tutorial/TrainingTutorialClient";
import { HOME_DECK_SIZE } from "@/core/services/home/deck-rules";
import { getPlayerBoardLoadout } from "@/services/game/get-player-board-deck";

export default async function TrainingTutorialPage() {
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
      <TrainingTutorialClient deck={loadout.deck!} fusionDeck={loadout.fusionDeck ?? []} />
    </main>
  );
}
