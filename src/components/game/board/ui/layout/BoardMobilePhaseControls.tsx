// src/components/game/board/ui/layout/BoardMobilePhaseControls.tsx - Dock móvil de fases junto al HUD del jugador con acciones de avance de turno.
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useBoardPerformanceProfile } from "@/components/game/board/internal/use-board-performance-profile";
import { BoardMobilePhaseButtons } from "@/components/game/board/ui/layout/internal/BoardMobilePhaseButtons";
import { resolveBoardMobilePhaseClasses } from "@/components/game/board/ui/layout/internal/resolve-board-mobile-phase-classes";
import { useBoardMobilePhaseLayout } from "@/components/game/board/ui/layout/internal/use-board-mobile-phase-layout";

interface BoardMobilePhaseControlsProps {
  phase: string;
  isPlayerTurn: boolean;
  hasWinner: boolean;
  onAdvancePhase: () => void;
  dockLeftPx?: number;
  bottomPx?: number;
}

export function BoardMobilePhaseControls({
  phase,
  isPlayerTurn,
  hasWinner,
  onAdvancePhase,
  dockLeftPx = 188,
  bottomPx = 46,
}: BoardMobilePhaseControlsProps) {
  const { isMain, isBattle, canAdvance, currentPhaseKey, sizing } = useBoardMobilePhaseLayout({
    phase,
    isPlayerTurn,
    hasWinner,
  });
  const invocarWidth = isMain ? sizing.activeWidth : sizing.compactWidth;
  const combateWidth = isBattle ? sizing.activeWidth : sizing.compactWidth;
  const pasarWidth = !isMain && !isBattle ? sizing.activeWidth : sizing.compactWidth;
  const { shouldReduceCombatEffects } = useBoardPerformanceProfile();
  const classes = resolveBoardMobilePhaseClasses({
    isMain,
    isBattle,
    canAdvance,
    cinematic: !shouldReduceCombatEffects,
  });

  if (shouldReduceCombatEffects) {
    return (
      <div
        data-tutorial-id="tutorial-board-phase-controls"
        className="absolute z-[290] flex max-w-[calc(100vw-10px)] items-center gap-1 overflow-x-auto pointer-events-auto"
        style={{ left: `${dockLeftPx}px`, bottom: `${bottomPx}px` }}
      >
        <BoardMobilePhaseButtons
          isMain={isMain}
          isBattle={isBattle}
          canAdvance={canAdvance}
          onAdvancePhase={onAdvancePhase}
          classes={classes}
          sizing={sizing}
          invocarWidth={invocarWidth}
          combateWidth={combateWidth}
          pasarWidth={pasarWidth}
          withMotion={false}
        />
      </div>
    );
  }

  return (
    <div
      data-tutorial-id="tutorial-board-phase-controls"
      className="absolute z-[290] flex max-w-[calc(100vw-10px)] items-center gap-1 overflow-x-auto pointer-events-auto"
      style={{ left: `${dockLeftPx}px`, bottom: `${bottomPx}px` }}
    >
      <AnimatePresence mode="popLayout">
        <motion.div
          key={currentPhaseKey}
          initial={{ opacity: 0.75, x: -26, skewX: -14 }}
          animate={{ opacity: 0, x: 132, skewX: -14 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="pointer-events-none absolute inset-y-0 left-0 z-[310] w-8 bg-white/70 mix-blend-overlay"
        />
      </AnimatePresence>
      <BoardMobilePhaseButtons
        isMain={isMain}
        isBattle={isBattle}
        canAdvance={canAdvance}
        onAdvancePhase={onAdvancePhase}
        classes={classes}
        sizing={sizing}
        invocarWidth={invocarWidth}
        combateWidth={combateWidth}
        pasarWidth={pasarWidth}
        withMotion
      />
    </div>
  );
}
