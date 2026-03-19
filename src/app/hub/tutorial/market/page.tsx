// src/app/hub/tutorial/market/page.tsx - Ruta legacy del nodo Market redirigida a la ubicación canónica de Academia.
import { redirect } from "next/navigation";

export default function LegacyTutorialMarketPage() {
  redirect("/hub/academy/tutorial/market");
}
