// src/components/game/board/internal/use-board-performance-profile.ts - Hook cliente que recolecta señales del dispositivo y resuelve el perfil de rendimiento del tablero.
"use client";

import { useEffect, useState } from "react";
import { isMobileLayoutViewport } from "@/components/internal/layout-breakpoints";
import {
  COMBAT_EFFECTS_OVERRIDE_EVENT,
  readCombatEffectsOverride,
} from "@/services/performance/combat-effects-override";
import { measureIsSlowCpu } from "./cpu-render-benchmark";
import { IBoardPerformanceProfile, resolveBoardPerformanceProfile } from "./resolve-board-performance-profile";

export type { IBoardPerformanceProfile } from "./resolve-board-performance-profile";

// Valor por defecto SSR-seguro: debe coincidir con lo que renderiza el servidor (sin window)
// para no provocar hydration mismatch. El valor real del dispositivo se calcula tras montar.
const SSR_SAFE_PROFILE: IBoardPerformanceProfile = {
  isMobileViewport: false,
  shouldReduceCombatEffects: false,
  combatEffectsBudget: "FULL",
};

function hasMatchMediaApi(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function";
}

function detectProfile(): IBoardPerformanceProfile {
  if (typeof window === "undefined") {
    return SSR_SAFE_PROFILE;
  }

  const prefersReducedMotion = hasMatchMediaApi()
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
  const concurrency = typeof navigator.hardwareConcurrency === "number" ? navigator.hardwareConcurrency : 8;
  const memory = typeof (navigator as Navigator & { deviceMemory?: number }).deviceMemory === "number"
    ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8
    : 8;

  return resolveBoardPerformanceProfile({
    isMobileViewport: isMobileLayoutViewport(window.innerWidth),
    prefersReducedMotion,
    hardwareConcurrency: concurrency,
    deviceMemory: memory,
    isSlowCpu: measureIsSlowCpu(),
    effectsOverride: readCombatEffectsOverride(),
  });
}

export function useBoardPerformanceProfile(): IBoardPerformanceProfile {
  // Arranca con el perfil SSR-seguro (igual en servidor y primer render cliente); el real llega en el efecto.
  const [profile, setProfile] = useState<IBoardPerformanceProfile>(SSR_SAFE_PROFILE);

  useEffect(() => {
    const syncProfile = () => setProfile(detectProfile());
    syncProfile();
    window.addEventListener("resize", syncProfile);
    // Re-sincroniza al instante cuando el jugador cambia el override desde el botón global.
    window.addEventListener(COMBAT_EFFECTS_OVERRIDE_EVENT, syncProfile);
    const mediaQuery = hasMatchMediaApi() ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    mediaQuery?.addEventListener("change", syncProfile);
    return () => {
      window.removeEventListener("resize", syncProfile);
      window.removeEventListener(COMBAT_EFFECTS_OVERRIDE_EVENT, syncProfile);
      mediaQuery?.removeEventListener("change", syncProfile);
    };
  }, []);

  return profile;
}
