// src/components/game/board/ui/layout/BoardMobilePhaseControls.tsx - Dock móvil de fases junto al HUD del jugador con acciones de avance de turno.
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Shield, SkipForward, Swords } from "lucide-react";
import { useBoardPerformanceProfile } from "@/components/game/board/internal/use-board-performance-profile";
import { BoardMobilePhaseButton } from "@/components/game/board/ui/layout/internal/BoardMobilePhaseButton";
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
        className="absolute z-[290] flex max-w-[calc(100vw-10px)] items-center gap-1 overflow-x-auto pointer-events-auto"
        style={{ left: `${dockLeftPx}px`, bottom: `${bottomPx}px` }}
      >
        <BoardMobilePhaseButton
          ariaLabel="Fase invocar"
          disabled
          icon={Shield}
          text={isMain ? "Invocar" : undefined}
          className={classes.invoke}
          heightPx={sizing.height}
          widthPx={invocarWidth}
          fontSizePx={sizing.fontSize}
          withMotion={false}
          isActive={isMain}
        />
        <BoardMobilePhaseButton
          ariaLabel="Pasar a combate"
          disabled={!canAdvance || !isMain}
          onClick={onAdvancePhase}
          icon={Swords}
          text={isBattle ? "Combate" : undefined}
          className={classes.battle}
          heightPx={sizing.height}
          widthPx={combateWidth}
          fontSizePx={sizing.fontSize}
          withMotion={false}
          isActive={isBattle}
        />
        <BoardMobilePhaseButton
          ariaLabel="Pasar turno"
          disabled={!canAdvance || !isBattle}
          onClick={onAdvancePhase}
          icon={SkipForward}
          text={!isMain && !isBattle ? "Pasar" : undefined}
          className={classes.pass}
          heightPx={sizing.height}
          widthPx={pasarWidth}
          fontSizePx={sizing.fontSize}
          withMotion={false}
          isActive={!isMain && !isBattle}
        />
      </div>
    );
  }

  return (
    <div
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
      <BoardMobilePhaseButton
        ariaLabel="Fase invocar"
        disabled
        icon={Shield}
        text={isMain ? "Invocar" : undefined}
        className={classes.invoke}
        heightPx={sizing.height}
        widthPx={invocarWidth}
        fontSizePx={sizing.fontSize}
        withMotion
        isActive={isMain}
      />
      <BoardMobilePhaseButton
        ariaLabel="Pasar a combate"
        disabled={!canAdvance || !isMain}
        onClick={onAdvancePhase}
        icon={Swords}
        text={isBattle ? "Combate" : undefined}
        className={classes.battle}
        heightPx={sizing.height}
        widthPx={combateWidth}
        fontSizePx={sizing.fontSize}
        withMotion
        isActive={isBattle}
      />
      <BoardMobilePhaseButton
        ariaLabel="Pasar turno"
        disabled={!canAdvance || !isBattle}
        onClick={onAdvancePhase}
        icon={SkipForward}
        text={!isMain && !isBattle ? "Pasar" : undefined}
        className={classes.pass}
        heightPx={sizing.height}
        widthPx={pasarWidth}
        fontSizePx={sizing.fontSize}
        withMotion
        isActive={!isMain && !isBattle}
      />
    </div>
  );
}
