// src/components/game/board/hooks/internal/layout/use-board-viewport-metrics.ts - Mide el viewport visible real para que el board afine su altura por encima de la base CSS (dvh).
"use client";

import { useEffect, useState } from "react";

interface IBoardViewportMetrics {
  width: number;
  height: number;
}

function readViewport(): IBoardViewportMetrics {
  const width = window.visualViewport?.width ?? window.innerWidth;
  const height = window.visualViewport?.height ?? window.innerHeight;
  return { width: Math.round(width), height: Math.round(height) };
}

/**
 * Alto/ancho reales del viewport visible (visualViewport API), para que el board excluya la barra
 * de direcciones del navegador móvil. Empieza en 0 (no lee `window` en el render inicial) para que
 * SSR y el primer render del cliente coincidan —sin desajuste de hidratación—; el contenedor usa la
 * altura CSS `dvh` como base hasta que este hook afina el valor exacto tras montar.
 *
 * Rendimiento: los eventos de viewport se agrupan con requestAnimationFrame y el estado (que
 * re-renderiza el board) solo se actualiza cuando el tamaño cambia de verdad.
 */
export function useBoardViewportMetrics(): IBoardViewportMetrics {
  const [metrics, setMetrics] = useState<IBoardViewportMetrics>({ width: 0, height: 0 });

  useEffect(() => {
    let frame = 0;
    const apply = () => {
      const next = readViewport();
      setMetrics((prev) => (prev.width === next.width && prev.height === next.height ? prev : next));
    };
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(apply);
    };
    sync();
    window.addEventListener("resize", sync, { passive: true });
    window.visualViewport?.addEventListener("resize", sync, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("resize", sync);
    };
  }, []);

  return metrics;
}
