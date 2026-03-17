// src/components/game/board/internal/use-board-performance-profile.ts - Perfil de rendimiento visual del tablero para degradar VFX en dispositivos justos.
"use client";

import { useEffect, useState } from "react";

export interface IBoardPerformanceProfile {
  isMobileViewport: boolean;
  shouldReduceCombatEffects: boolean;
}

function hasMatchMediaApi(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function";
}

function detectProfile(): IBoardPerformanceProfile {
  if (typeof window === "undefined") {
    return { isMobileViewport: false, shouldReduceCombatEffects: false };
  }

  const isMobileViewport = window.innerWidth <= 1024;
  const prefersReducedMotion = hasMatchMediaApi()
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
  const concurrency = typeof navigator.hardwareConcurrency === "number" ? navigator.hardwareConcurrency : 8;
  const memory = typeof (navigator as Navigator & { deviceMemory?: number }).deviceMemory === "number"
    ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8
    : 8;
  const isConstrainedDevice = concurrency <= 4 || memory <= 4;

  const forceReduceByFlag = (() => {
    try {
      return window.localStorage.getItem("combat-effects-profile") === "reduced";
    } catch {
      return false;
    }
  })();

  return {
    isMobileViewport,
    shouldReduceCombatEffects: forceReduceByFlag || prefersReducedMotion || isMobileViewport || isConstrainedDevice,
  };
}

export function useBoardPerformanceProfile(): IBoardPerformanceProfile {
  const [profile, setProfile] = useState<IBoardPerformanceProfile>(() => detectProfile());

  useEffect(() => {
    const syncProfile = () => setProfile(detectProfile());
    syncProfile();
    window.addEventListener("resize", syncProfile);
    const mediaQuery = hasMatchMediaApi() ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    mediaQuery?.addEventListener("change", syncProfile);
    return () => {
      window.removeEventListener("resize", syncProfile);
      mediaQuery?.removeEventListener("change", syncProfile);
    };
  }, []);

  return profile;
}
