// src/components/game/board/ui/internal/duel-result-overlay/use-duel-result-mobile.ts - Gestiona detección responsive y pestaña activa en el resumen móvil.
"use client";

import { useEffect, useState } from "react";

type DuelResultMobileTab = "CARDS" | "GIFT";

interface IUseDuelResultMobileState {
  isMobile: boolean;
  mobileTab: DuelResultMobileTab;
  setMobileTab: (tab: DuelResultMobileTab) => void;
}

/**
 * Mantiene sincronizado el modo móvil y la pestaña activa del overlay.
 */
export function useDuelResultMobileState(): IUseDuelResultMobileState {
  const [isMobile, setIsMobile] = useState(false);
  const [mobileTab, setMobileTab] = useState<DuelResultMobileTab>("CARDS");

  useEffect(() => {
    const syncViewport = () => setIsMobile(window.innerWidth <= 1024);
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  return { isMobile, mobileTab, setMobileTab };
}
