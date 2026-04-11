// src/components/hub/academy/tutorial/internal/TutorialFirstRunSoundtrackSeed.tsx - Activa soundtrack persistente de primera vuelta al entrar en el mapa tutorial guiado.
"use client";

import { useEffect } from "react";
import { markTutorialSoundtrackFirstRunStarted } from "@/components/hub/academy/tutorial/internal/tutorial-soundtrack-session";

interface ITutorialFirstRunSoundtrackSeedProps {
  shouldActivate: boolean;
}

/**
 * Si se entra al flujo tutorial y no está finalizado, activa estado de soundtrack de primera vuelta.
 */
export function TutorialFirstRunSoundtrackSeed({ shouldActivate }: ITutorialFirstRunSoundtrackSeedProps) {
  useEffect(() => {
    if (!shouldActivate) return;
    markTutorialSoundtrackFirstRunStarted();
  }, [shouldActivate]);

  return null;
}
