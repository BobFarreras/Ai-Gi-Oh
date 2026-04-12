// src/app/hub/home/page.tsx - Redirige ruta legacy /hub/home hacia la ruta canónica /hub/arsenal.
import { redirect } from "next/navigation";

export default function HomeLegacyRedirectPage() {
  redirect("/hub/arsenal");
}
