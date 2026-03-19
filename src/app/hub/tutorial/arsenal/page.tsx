// src/app/hub/tutorial/arsenal/page.tsx - Ruta legacy del nodo Arsenal redirigida a la ubicación canónica de Academia.
import { redirect } from "next/navigation";

export default function LegacyTutorialArsenalPage() {
  redirect("/hub/academy/tutorial/arsenal");
}
