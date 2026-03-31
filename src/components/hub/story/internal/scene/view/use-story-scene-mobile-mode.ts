// src/components/hub/story/internal/scene/view/use-story-scene-mobile-mode.ts - Detecta modo móvil para seleccionar layout Story sin afectar desktop.
"use client";
import { useEffect, useState } from "react";
import { isMobileLayoutViewport } from "@/components/internal/layout-breakpoints";

/**
 * Mantiene selector de layout por viewport en cliente.
 */
export function useStorySceneMobileMode(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => (typeof window === "undefined" ? false : isMobileLayoutViewport(window.innerWidth)));
  useEffect(() => {
    const onResize = () => setIsMobile(isMobileLayoutViewport(window.innerWidth));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return isMobile;
}
