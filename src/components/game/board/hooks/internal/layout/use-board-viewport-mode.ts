// src/components/game/board/hooks/internal/layout/use-board-viewport-mode.ts - Detecta si el tablero debe renderizar layout móvil sin alterar reglas de combate.
import { useEffect, useState } from "react";
import { isMobileLayoutViewport } from "@/components/internal/layout-breakpoints";

interface IBoardViewportMode {
  isMobile: boolean;
}

function resolveIsMobile(width: number): boolean {
  return isMobileLayoutViewport(width);
}

export function useBoardViewportMode(): IBoardViewportMode {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateMode = () => {
      const next = resolveIsMobile(window.innerWidth);
      setIsMobile(next);
    };
    updateMode();
    window.addEventListener("resize", updateMode);
    return () => window.removeEventListener("resize", updateMode);
  }, []);

  return { isMobile };
}
