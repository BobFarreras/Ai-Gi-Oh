// src/app/hub/academy/tutorial/arsenal/page.tsx - Página server-side del nodo Preparar Deck con sandbox mock seguro para práctica guiada.
import { TutorialArsenalClient } from "@/components/hub/academy/tutorial/nodes/arsenal/TutorialArsenalClient";
import { createTutorialArsenalMockData } from "@/components/hub/academy/tutorial/nodes/arsenal/internal/create-tutorial-arsenal-mock-data";
import { TutorialFirstRunSoundtrackSeed } from "@/components/hub/academy/tutorial/internal/TutorialFirstRunSoundtrackSeed";
import { HubSectionEntryBurst } from "@/components/hub/sections/HubSectionEntryBurst";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function TutorialArsenalPage() {
  const session = await getCurrentUserSession();
  const playerId = session?.user.id ?? "tutorial-local-player";
  const mockData = createTutorialArsenalMockData(playerId);
  return (
    <>
      <HubSectionEntryBurst />
      <TutorialFirstRunSoundtrackSeed shouldActivate />
      <TutorialArsenalClient
        playerId={playerId}
        initialDeck={mockData.deck}
        collection={mockData.collection}
        initialCardProgress={mockData.cardProgress}
      />
    </>
  );
}
