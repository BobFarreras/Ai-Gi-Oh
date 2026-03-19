// src/app/hub/training/page.tsx - Alias legacy de Training que redirige a la página canónica de Academia.
import { redirect } from "next/navigation";

export default async function TrainingPage() {
  redirect("/hub/academy");
}
