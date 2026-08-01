// src/app/hub/academy/training/arena/olympus/page.tsx - Página del modo Olimpo: desafíos legendarios con intentos diarios.
import type { Metadata } from "next";
import { OlympusArenaClient } from "@/components/hub/academy/training/modes/olympus/OlympusArenaClient";

export const metadata: Metadata = {
  title: "Olimpo | Nexus Combat",
  description: "Presta el mazo de un campeón derrotado y desafía a las leyendas del Olimpo.",
};

export default function OlympusArenaPage() {
  return <OlympusArenaClient />;
}
