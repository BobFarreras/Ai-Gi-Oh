// src/app/hub/tutorial/reward/page.tsx - Ruta legacy del nodo recompensa redirigida a la ubicación canónica de Academia.
import { redirect } from "next/navigation";

export default function LegacyTutorialRewardPage() {
  redirect("/hub/academy/tutorial/reward");
}
