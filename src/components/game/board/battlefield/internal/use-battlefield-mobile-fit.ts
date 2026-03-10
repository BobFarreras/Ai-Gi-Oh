// src/components/game/board/battlefield/internal/use-battlefield-mobile-fit.ts - Hook de ajuste de escala y offset vertical para móviles en Battlefield.
import { useEffect, useState } from "react";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function useBattlefieldMobileFit(isMobileLayout: boolean): { mobileFitScale: number; mobileBoardOffsetY: number } {
  const [mobileFitScale, setMobileFitScale] = useState(1);
  const [mobileBoardOffsetY, setMobileBoardOffsetY] = useState(-72);

  useEffect(() => {
    if (!isMobileLayout) return;
    const update = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const narrowPenalty = clamp((430 - width) / 140, 0, 1);
      const shortPenalty = clamp((860 - height) / 260, 0, 1);
      const fitScale = clamp(1 - narrowPenalty * 0.14 - shortPenalty * 0.11, 0.74, 1);
      const offsetY = Math.round(-68 - shortPenalty * 22);
      setMobileFitScale(fitScale);
      setMobileBoardOffsetY(offsetY);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [isMobileLayout]);

  return { mobileFitScale, mobileBoardOffsetY };
}
