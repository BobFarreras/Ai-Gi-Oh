// src/app/hub/academy/training/tutorial/page.tsx - Entry server-side del tutorial de combate usando sandbox mock estable y reproducible.
import { HubSectionEntryBurst } from "@/components/hub/sections/HubSectionEntryBurst";
import { TrainingTutorialClient } from "@/components/hub/academy/training/modes/tutorial/TrainingTutorialClient";
import { createTutorialCombatLoadout } from "@/components/hub/academy/training/modes/tutorial/internal/create-tutorial-combat-loadout";

export default async function TrainingTutorialPage() {
  const loadout = createTutorialCombatLoadout();
  return (
    <>
      <HubSectionEntryBurst />
      <TrainingTutorialClient
        deck={loadout.playerDeck}
        fusionDeck={loadout.playerFusionDeck}
        opponentDeck={loadout.opponentDeck}
        opponentFusionDeck={loadout.opponentFusionDeck}
        seed={loadout.seed}
      />
    </>
  );
}
