// src/app/hub/academy/training/arena/page.tsx - Entrada server-side al portal de modalidades de combate.
import { CombatModePortal } from "@/components/hub/academy/training/combat-modes/CombatModePortal";
import { HubSectionEntryBurst } from "@/components/hub/sections/HubSectionEntryBurst";

/** Mantiene el portal independiente del runtime pesado de cada modalidad. */
export default function CombatModesPage() {
  return (
    <>
      <HubSectionEntryBurst />
      <CombatModePortal />
    </>
  );
}
