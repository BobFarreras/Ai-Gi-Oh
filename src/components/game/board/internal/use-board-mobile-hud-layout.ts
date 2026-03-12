// src/components/game/board/internal/use-board-mobile-hud-layout.ts - Calcula anclajes móviles del HUD usando viewport real y safe-area para evitar recortes.
"use client";

import { useEffect, useMemo, useState } from "react";

interface IBoardMobileHudLayout {
  opponentHudTopPx: number;
  playerHudBottomPx: number;
  controlsBottomPx: number;
  energyBottomPx: number;
  dockLeftPx: number;
}

interface IViewportSnapshot {
  width: number;
  height: number;
  safeLeft: number;
  safeTop: number;
  safeBottom: number;
}

function readSafeInsetPx(variableName: string): number {
  if (typeof window === "undefined") return 0;
  const probe = document.createElement("div");
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  probe.style.width = "0";
  probe.style.height = "0";
  probe.style.setProperty("padding-left", `env(${variableName})`);
  document.body.appendChild(probe);
  const computed = window.getComputedStyle(probe).paddingLeft;
  document.body.removeChild(probe);
  const parsed = Number.parseFloat(computed);
  return Number.isFinite(parsed) ? parsed : 0;
}

function captureViewport(): IViewportSnapshot {
  const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
  const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
  return {
    width: Math.round(viewportWidth),
    height: Math.round(viewportHeight),
    safeLeft: Math.round(readSafeInsetPx("safe-area-inset-left")),
    safeTop: Math.round(readSafeInsetPx("safe-area-inset-top")),
    safeBottom: Math.round(readSafeInsetPx("safe-area-inset-bottom")),
  };
}

/**
 * Ajusta offsets de HUD/controles/energía para que no queden fuera del viewport móvil real.
 */
export function useBoardMobileHudLayout(): IBoardMobileHudLayout {
  const [snapshot, setSnapshot] = useState<IViewportSnapshot>({
    width: 390,
    height: 844,
    safeLeft: 0,
    safeTop: 0,
    safeBottom: 0,
  });

  useEffect(() => {
    const sync = () => setSnapshot(captureViewport());
    sync();
    window.addEventListener("resize", sync, { passive: true });
    window.visualViewport?.addEventListener("resize", sync, { passive: true });
    return () => {
      window.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("resize", sync);
    };
  }, []);

  return useMemo(() => {
    const compactHeight = snapshot.height <= 700;
    const veryCompactHeight = snapshot.height <= 620;
    const opponentHudTopPx = snapshot.safeTop + (veryCompactHeight ? 2 : compactHeight ? 4 : 6);
    const playerHudBottomPx = snapshot.safeBottom + (veryCompactHeight ? 2 : compactHeight ? 4 : 6);
    const controlsBottomPx = snapshot.safeBottom + (veryCompactHeight ? 34 : compactHeight ? 38 : 46);
    const energyBottomPx = snapshot.safeBottom + (veryCompactHeight ? 4 : compactHeight ? 6 : 10);
    const hudWidthPx = Math.round(Math.min(268, Math.max(188, snapshot.width * 0.36)));
    const minDockLeft = snapshot.safeLeft + 6;
    const maxDockLeft = Math.max(minDockLeft, snapshot.width - snapshot.safeLeft - 154);
    const dockLeftPx = Math.round(Math.min(maxDockLeft, Math.max(minDockLeft, hudWidthPx - 1)));
    return { opponentHudTopPx, playerHudBottomPx, controlsBottomPx, energyBottomPx, dockLeftPx };
  }, [snapshot]);
}
