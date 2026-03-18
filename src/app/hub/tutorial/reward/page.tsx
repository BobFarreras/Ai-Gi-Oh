// src/app/hub/tutorial/reward/page.tsx - Nodo final del tutorial con claim idempotente de recompensa y feedback al jugador.
import { HubSectionEntryBurst } from "@/components/hub/sections/HubSectionEntryBurst";
import { TutorialRewardClient } from "@/app/hub/tutorial/reward/TutorialRewardClient";
import { getTutorialMapRuntimeData } from "@/services/tutorial/get-tutorial-map-runtime-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function TutorialRewardPage() {
  const nodes = await getTutorialMapRuntimeData();
  const rewardNode = nodes.find((node) => node.id === "tutorial-final-reward");
  return (
    <main className="hub-control-room-bg min-h-dvh px-4 py-8 text-slate-100 sm:px-6">
      <HubSectionEntryBurst />
      <TutorialRewardClient rewardNodeState={rewardNode?.state ?? "LOCKED"} />
    </main>
  );
}
