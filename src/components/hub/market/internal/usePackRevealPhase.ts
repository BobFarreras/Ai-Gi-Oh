// src/components/hub/market/internal/usePackRevealPhase.ts - Controla la máquina de fases del overlay de apertura de sobres.
"use client";

import { useEffect, useState } from "react";

export type RevealPhase = "IDLE" | "OPENING" | "REVEALED";

interface UsePackRevealPhaseInput {
  isOpen: boolean;
}

export function usePackRevealPhase({ isOpen }: UsePackRevealPhaseInput) {
  const [phase, setPhase] = useState<RevealPhase>("IDLE");

  useEffect(() => {
    if (!isOpen) return;
    if (phase === "REVEALED") return;
    const timeout = setTimeout(() => {
      setPhase((previous) => (previous === "IDLE" ? "OPENING" : "REVEALED"));
    }, phase === "IDLE" ? 1500 : 600);
    return () => clearTimeout(timeout);
  }, [isOpen, phase]);

  function resetPhase(): void {
    setTimeout(() => setPhase("IDLE"), 500);
  }

  return { phase, resetPhase };
}
