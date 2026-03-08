// src/components/game/board/hooks/internal/layout/use-board-viewport-scale.ts - Hook de viewport para calcular autozoom del tablero y densidad de mano.
import { useEffect, useState } from "react";
import { IBoardViewportMetrics, resolveBoardViewportMetrics } from "./board-layout-metrics";

interface IUseBoardViewportScaleInput {
  hasLeftPanel: boolean;
  hasRightPanel: boolean;
}

const FALLBACK_METRICS: IBoardViewportMetrics = {
  boardScale: 1,
  handCardScale: 0.82,
  handOverlapPx: 22,
  handYOffsetPx: 118,
  handContainerHeightPx: 500,
  handHoverLiftPx: 34,
  handCenterOffsetPx: 0,
};

function readViewport(): { width: number; height: number } {
  if (typeof window === "undefined") return { width: 1920, height: 1080 };
  return { width: window.innerWidth, height: window.innerHeight };
}

export function useBoardViewportScale(input: IUseBoardViewportScaleInput): IBoardViewportMetrics {
  const [metrics, setMetrics] = useState<IBoardViewportMetrics>(FALLBACK_METRICS);

  useEffect(() => {
    const update = () => {
      const viewport = readViewport();
      setMetrics(resolveBoardViewportMetrics({ ...viewport, hasLeftPanel: input.hasLeftPanel, hasRightPanel: input.hasRightPanel }));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [input.hasLeftPanel, input.hasRightPanel]);

  return metrics;
}
