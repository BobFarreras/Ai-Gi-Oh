// src/components/hub/academy/internal/AcademyTutorialSoundtrackController.tsx - Controla soundtrack narrativo del tutorial durante la primera vuelta en rutas Academy.
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ONBOARDING_AUDIO_CATALOG } from "@/components/hub/onboarding/internal/onboarding-audio-catalog";
import { isTutorialSoundtrackFirstRunActive, TUTORIAL_SOUNDTRACK_STATE_EVENT } from "@/components/hub/academy/tutorial/internal/tutorial-soundtrack-session";

function shouldPlayTutorialSoundtrack(pathname: string): boolean {
  if (pathname.startsWith("/hub/academy/training/tutorial")) return false;
  return pathname === "/hub/academy/tutorial" || pathname.startsWith("/hub/academy/tutorial/arsenal") || pathname.startsWith("/hub/academy/tutorial/market");
}

/**
 * Mantiene loop del soundtrack de onboarding solo mientras el usuario recorre su primera vuelta tutorial.
 */
export function AcademyTutorialSoundtrackController() {
  const pathname = usePathname();
  const soundtrackRef = useRef<HTMLAudioElement | null>(null);
  const [isFirstRunActive, setIsFirstRunActive] = useState(false);
  const shouldPlay = useMemo(() => shouldPlayTutorialSoundtrack(pathname) && isFirstRunActive, [isFirstRunActive, pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncState = () => setIsFirstRunActive(isTutorialSoundtrackFirstRunActive());
    syncState();
    window.addEventListener(TUTORIAL_SOUNDTRACK_STATE_EVENT, syncState);
    window.addEventListener("storage", syncState);
    return () => {
      window.removeEventListener(TUTORIAL_SOUNDTRACK_STATE_EVENT, syncState);
      window.removeEventListener("storage", syncState);
    };
  }, []);

  useEffect(() => {
    if (!shouldPlay) {
      soundtrackRef.current?.pause();
      soundtrackRef.current = null;
      return;
    }
    if (!soundtrackRef.current) {
      const soundtrack = new Audio(ONBOARDING_AUDIO_CATALOG.soundtrack);
      soundtrack.loop = true;
      soundtrack.volume = 0.34;
      soundtrackRef.current = soundtrack;
    }
    void soundtrackRef.current.play().catch(() => undefined);
    return () => {
      soundtrackRef.current?.pause();
      soundtrackRef.current = null;
    };
  }, [shouldPlay]);

  return null;
}
