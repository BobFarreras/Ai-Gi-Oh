// src/components/game/board/PlayerHUD.tsx - HUD principal desacoplado para jugador/oponente con feedback, retrato y control de fases.
"use client";

import { motion } from "framer-motion";
import { IPlayer } from "@/core/entities/IPlayer";
import { cn } from "@/lib/utils";
import { HudFloatingDelta } from "./internal/HudFloatingDelta";
import { HudDialogueBubble } from "./internal/HudDialogueBubble";
import { useHudFeedback } from "./hooks/internal/useHudFeedback";
import { HudPortraitCard } from "./internal/HudPortraitCard";
import { HudPhaseControls } from "./internal/HudPhaseControls";

interface PlayerHUDProps {
  isOpponent: boolean;
  player: IPlayer;
  isActiveTurn: boolean;
  badgeText?: string;
  wasDamagedThisAction?: boolean;
  damagePulseKey?: string | null;
  damageAmount?: number | null;
  wasHealedThisAction?: boolean;
  healPulseKey?: string | null;
  healAmount?: number | null;
  wasEnergyGainedThisAction?: boolean;
  energyPulseKey?: string | null;
  energyAmount?: number | null;
  avatarUrl?: string | null;
  dialogueMessage?: string | null;
  phase?: string;
  onAdvancePhase?: () => void;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
  showPhaseControls?: boolean;
  showEnergy?: boolean;
}

export function PlayerHUD({
  isOpponent,
  player,
  isActiveTurn,
  badgeText,
  wasDamagedThisAction = false,
  damagePulseKey = null,
  damageAmount = null,
  wasHealedThisAction = false,
  healPulseKey = null,
  healAmount = null,
  wasEnergyGainedThisAction = false,
  energyPulseKey = null,
  energyAmount = null,
  avatarUrl = null,
  dialogueMessage = null,
  phase = "MAIN_1",
  onAdvancePhase,
  containerClassName,
  containerStyle,
  showPhaseControls = true,
  showEnergy = true,
}: PlayerHUDProps) {
  const { damageTaken, healGained, energyGained, isShaking } = useHudFeedback(
    wasDamagedThisAction,
    damagePulseKey,
    damageAmount,
    wasHealedThisAction,
    healPulseKey,
    healAmount,
    wasEnergyGainedThisAction,
    energyPulseKey,
    energyAmount,
  );

  const shakeAnimation = isShaking ? { x: isOpponent ? [0, -8, 8, -5, 5, 0] : [0, 8, -8, 5, -5, 0] } : { x: 0 };

  return (
    <motion.div
      initial={{ x: isOpponent ? 100 : -100, y: isOpponent ? -50 : 50, opacity: 0 }}
      // EFECTO DIMMING: Si no es su turno, se vuelve gris y se apaga levemente
      animate={{ 
        ...shakeAnimation, 
        opacity: isActiveTurn ? 1 : 0.65, 
        filter: isActiveTurn ? "grayscale(0%) brightness(1)" : "grayscale(80%) brightness(0.6)",
        x: 0, 
        y: 0 
      }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      style={containerStyle}
      className={cn(
        "absolute z-[100] flex w-[clamp(18rem,30vw,26.25rem)] h-[clamp(6.9rem,12vh,9.5rem)] md:h-[clamp(7.6rem,13vh,10.4rem)] transition-all duration-300 pointer-events-none",
        isOpponent ? "top-0 right-0 justify-start" : "bottom-0 left-0 justify-end",
        containerClassName,
      )}
    >
      <HudFloatingDelta value={damageTaken} sign="-" isOpponent={isOpponent} color="red" />
      <HudFloatingDelta value={healGained} sign="+" isOpponent={isOpponent} color="green" />
      <HudFloatingDelta value={energyGained} sign="+" isOpponent={isOpponent} color="yellow" />
      {healGained ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.72 }}
          animate={{ opacity: [0, 1, 0], scale: [0.72, 1.26, 1.02] }}
          transition={{ duration: 1.28, ease: "easeOut" }}
          className={cn("absolute z-[192] h-28 w-28 rounded-full bg-emerald-400/42 blur-xl", isOpponent ? "left-7 bottom-1" : "right-7 top-1")}
        />
      ) : null}
      {energyGained ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: [0, 1, 0], scale: [0.7, 1.2, 1] }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className={cn("absolute z-[190] h-24 w-24 rounded-full bg-yellow-400/35 blur-xl", isOpponent ? "left-8 bottom-2" : "right-8 top-2")}
        />
      ) : null}
      <HudDialogueBubble isOpponent={isOpponent} message={dialogueMessage} />
      <HudPortraitCard
        isOpponent={isOpponent}
        player={player}
        isActiveTurn={isActiveTurn}
        avatarUrl={avatarUrl}
        badgeText={badgeText}
        showEnergy={showEnergy}
      />
      <HudPhaseControls phase={phase} isVisible={showPhaseControls && !isOpponent && isActiveTurn} onAdvancePhase={onAdvancePhase} />
    </motion.div>
  );
}
