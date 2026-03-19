// src/app/hub/tutorial/page.tsx - Ruta legacy del mapa tutorial redirigida a la ubicación canónica de Academia.
import { redirect } from "next/navigation";

export default function LegacyTutorialMapPage() {
  redirect("/hub/academy/tutorial");
}
