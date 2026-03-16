// src/components/hub/story/internal/scene/view/use-story-scene-mobile-mode.ts - Detecta modo móvil para seleccionar layout Story sin afectar desktop.
"use client";
import { useEffect, useState } from "react";

const STORY_MOBILE_BREAKPOINT_PX = 1024;

/**
 * Mantiene selector de layout por viewport en cliente.
 */
export function useStorySceneMobileMode(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => (typeof window === "undefined" ? false : window.innerWidth < STORY_MOBILE_BREAKPOINT_PX));
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < STORY_MOBILE_BREAKPOINT_PX);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return isMobile;
}
