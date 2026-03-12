// src/components/game/board/ui/layout/internal/use-board-mobile-phase-layout.ts - Hook para calcular tamaño y estado visual del dock móvil de fases.
"use client";

import { useEffect, useMemo, useState } from "react";

interface IBoardMobilePhaseLayoutInput {
  phase: string;
  isPlayerTurn: boolean;
  hasWinner: boolean;
}

interface IBoardMobilePhaseSizing {
  height: number;
  compactWidth: number;
  activeWidth: number;
  fontSize: number;
}

interface IBoardMobilePhaseLayoutResult {
  isMain: boolean;
  isBattle: boolean;
  canAdvance: boolean;
  currentPhaseKey: "INVOCAR" | "COMBATE" | "PASAR";
  sizing: IBoardMobilePhaseSizing;
}

function resolveSizing(viewportWidth: number): IBoardMobilePhaseSizing {
  const freeWidth = Math.max(0, viewportWidth - 300);
  const grow = Math.min(1, freeWidth / 120);
  return {
    height: 32 + Math.round(grow * 8),
    compactWidth: 36 + Math.round(grow * 8),
    activeWidth: 70 + Math.round(grow * 24),
    fontSize: 8 + Math.round(grow * 1),
  };
}

function resolveCurrentPhaseKey(isMain: boolean, isBattle: boolean): "INVOCAR" | "COMBATE" | "PASAR" {
  if (isMain) return "INVOCAR";
  if (isBattle) return "COMBATE";
  return "PASAR";
}

/**
 * Calcula estado de fase y tamaños responsivos del dock móvil en una sola fuente de verdad.
 */
export function useBoardMobilePhaseLayout(input: IBoardMobilePhaseLayoutInput): IBoardMobilePhaseLayoutResult {
  const [viewportWidth, setViewportWidth] = useState(390);
  useEffect(() => {
    const syncViewport = () => setViewportWidth(window.innerWidth);
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  return useMemo(() => {
    const normalized = input.phase.toUpperCase();
    const isMain = normalized.includes("MAIN");
    const isBattle = normalized.includes("BATTLE");
    return {
      isMain,
      isBattle,
      canAdvance: input.isPlayerTurn && !input.hasWinner,
      currentPhaseKey: resolveCurrentPhaseKey(isMain, isBattle),
      sizing: resolveSizing(viewportWidth),
    };
  }, [input.hasWinner, input.isPlayerTurn, input.phase, viewportWidth]);
}
