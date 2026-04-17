// src/components/game/board/ui/layout/internal/BoardMobilePhaseButtons.tsx - Renderiza la triada de botones de fase del dock móvil.
"use client";
import { Shield, SkipForward, Swords } from "lucide-react";
import { BoardMobilePhaseButton } from "@/components/game/board/ui/layout/internal/BoardMobilePhaseButton";
import { IBoardMobilePhaseSizing } from "@/components/game/board/ui/layout/internal/use-board-mobile-phase-layout";

interface IBoardMobilePhaseButtonsProps {
  isMain: boolean;
  isBattle: boolean;
  canAdvance: boolean;
  onAdvancePhase: () => void;
  classes: { invoke: string; battle: string; pass: string };
  sizing: IBoardMobilePhaseSizing;
  invocarWidth: number;
  combateWidth: number;
  pasarWidth: number;
  withMotion: boolean;
}

/**
 * Centraliza el render de botones para evitar duplicidad entre modo animado y reducido.
 */
export function BoardMobilePhaseButtons({
  isMain,
  isBattle,
  canAdvance,
  onAdvancePhase,
  classes,
  sizing,
  invocarWidth,
  combateWidth,
  pasarWidth,
  withMotion,
}: IBoardMobilePhaseButtonsProps) {
  return (
    <>
      <BoardMobilePhaseButton
        ariaLabel="Fase invocar"
        tutorialId="tutorial-board-phase-invoke-button"
        disabled
        icon={Shield}
        text={isMain ? "Invocar" : undefined}
        className={classes.invoke}
        heightPx={sizing.height}
        widthPx={invocarWidth}
        fontSizePx={sizing.fontSize}
        withMotion={withMotion}
        isActive={isMain}
      />
      <BoardMobilePhaseButton
        ariaLabel="Pasar a combate"
        tutorialId="tutorial-board-phase-battle-button"
        disabled={!canAdvance || !isMain}
        onClick={onAdvancePhase}
        icon={Swords}
        text={isBattle ? "Combate" : undefined}
        className={classes.battle}
        heightPx={sizing.height}
        widthPx={combateWidth}
        fontSizePx={sizing.fontSize}
        withMotion={withMotion}
        isActive={isBattle}
      />
      <BoardMobilePhaseButton
        ariaLabel="Pasar turno"
        tutorialId="tutorial-board-phase-pass-button"
        disabled={!canAdvance || !isBattle}
        onClick={onAdvancePhase}
        icon={SkipForward}
        text={!isMain && !isBattle ? "Pasar" : undefined}
        className={classes.pass}
        heightPx={sizing.height}
        widthPx={pasarWidth}
        fontSizePx={sizing.fontSize}
        withMotion={withMotion}
        isActive={!isMain && !isBattle}
      />
    </>
  );
}
