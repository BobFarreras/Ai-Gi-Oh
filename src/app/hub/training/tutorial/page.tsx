// src/app/hub/training/tutorial/page.tsx - Ruta legacy de tutorial de combate redirigida a la ubicación canónica de Academia.
import { redirect } from "next/navigation";

export default function LegacyTrainingTutorialPage() {
  redirect("/hub/academy/training/tutorial");
}
