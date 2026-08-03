// src/app/hub/academy/training/arena/survival/page.tsx - Entry server-side del modo Supervivencia.
import { HubSectionEntryBurst } from "@/components/hub/sections/HubSectionEntryBurst";
import { SurvivalArenaClient } from "@/components/hub/academy/training/modes/survival/SurvivalArenaClient";

export default function SurvivalArenaPage() {
  return (
    <>
      <HubSectionEntryBurst />
      <SurvivalArenaClient />
    </>
  );
}
