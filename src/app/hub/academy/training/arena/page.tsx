// src/app/hub/academy/training/arena/page.tsx - Entrada server-side al portal de modalidades de combate.
import { CombatModesScene } from "@/components/hub/academy/training/combat-modes/scene/CombatModesScene";
import { HubSectionEntryBurst } from "@/components/hub/sections/HubSectionEntryBurst";

/** El shell decide entre el mundo 3D y el portal 2D; el runtime pesado de cada modo sigue aparte. */
export default function CombatModesPage() {
  return (
    <>
      <HubSectionEntryBurst />
      <CombatModesScene />
    </>
  );
}
