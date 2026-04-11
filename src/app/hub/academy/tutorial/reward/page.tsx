// src/app/hub/academy/tutorial/reward/page.tsx - Nodo final del tutorial con claim idempotente de recompensa y feedback al jugador.
import { AcademyBackButton } from "@/components/hub/academy/AcademyBackButton";
import { HubSectionEntryBurst } from "@/components/hub/sections/HubSectionEntryBurst";
import { TutorialRewardClient } from "@/components/hub/academy/tutorial/nodes/reward/TutorialRewardClient";
import { ACADEMY_TUTORIAL_MAP_ROUTE } from "@/core/constants/routes/academy-routes";
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
      <div className="mx-auto mt-4 flex w-full max-w-3xl justify-start">
        <AcademyBackButton label="Volver al tutorial" href={ACADEMY_TUTORIAL_MAP_ROUTE} className="w-auto" />
      </div>
    </main>
  );
}
