// src/components/game/board/hooks/internal/layout/use-board-viewport-mode.ts - Detecta si el tablero debe renderizar layout móvil sin alterar reglas de combate.
import { useEffect, useState } from "react";

interface IBoardViewportMode {
  isMobile: boolean;
}

function resolveIsMobile(width: number, height: number): boolean {
  return width <= 1024 || (width <= 1280 && height <= 820);
}

export function useBoardViewportMode(): IBoardViewportMode {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateMode = () => {
      const next = resolveIsMobile(window.innerWidth, window.innerHeight);
      setIsMobile(next);
    };
    updateMode();
    window.addEventListener("resize", updateMode);
    return () => window.removeEventListener("resize", updateMode);
  }, []);

  return { isMobile };
}
