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
  wasEnergyLostThisAction?: boolean;
  energyLossPulseKey?: string | null;
  energyLossAmount?: number | null;
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
  wasEnergyLostThisAction = false,
  energyLossPulseKey = null,
  energyLossAmount = null,
  avatarUrl = null,
  dialogueMessage = null,
  phase = "MAIN_1",
  onAdvancePhase,
  containerClassName,
  containerStyle,
  showPhaseControls = true,
  showEnergy = true,
}: PlayerHUDProps) {
  const { damageTaken, healGained, energyGained, energyLost, isShaking } = useHudFeedback(
    wasDamagedThisAction,
    damagePulseKey,
    damageAmount,
    wasHealedThisAction,
    healPulseKey,
    healAmount,
    wasEnergyGainedThisAction,
    energyPulseKey,
    energyAmount,
    wasEnergyLostThisAction,
    energyLossPulseKey,
    energyLossAmount,
  );
  // Si hay feedback activo, el HUD recupera color aunque no sea su turno.
  const hasActiveFeedback = Boolean(damageTaken || healGained || energyGained || energyLost);
  const shouldDim = !isActiveTurn && !hasActiveFeedback;

  const shakeAnimation = isShaking ? { x: isOpponent ? [0, -8, 8, -5, 5, 0] : [0, 8, -8, 5, -5, 0] } : { x: 0 };

  return (
    <motion.div
      initial={{ x: isOpponent ? 100 : -100, y: isOpponent ? -50 : 50, opacity: 0 }}
      animate={{ 
        ...shakeAnimation, 
        opacity: shouldDim ? 0.65 : 1,
        filter: shouldDim ? "grayscale(80%) brightness(0.6)" : "grayscale(0%) brightness(1)",
        x: 0, 
        y: 0 
      }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      style={containerStyle}
      className={cn(
        "absolute z-[100] flex w-[clamp(18rem,30vw,26.25rem)] h-[120px] xl:h-[140px] transition-all duration-300 pointer-events-none",
        isOpponent ? "top-0 right-0 justify-start" : "bottom-0 left-0 justify-end",
        containerClassName,
      )}
    >
      <HudFloatingDelta value={damageTaken} sign="-" isOpponent={isOpponent} color="red" pulseKey={damagePulseKey} anchor="HEALTH" />
      <HudFloatingDelta value={healGained} sign="+" isOpponent={isOpponent} color="green" pulseKey={healPulseKey} anchor="HEALTH" />
      <HudFloatingDelta value={energyGained} sign="+" isOpponent={isOpponent} color="yellow" pulseKey={energyPulseKey} anchor="ENERGY" />
      <HudFloatingDelta value={energyLost} sign="-" isOpponent={isOpponent} color="purple" pulseKey={energyLossPulseKey} anchor="ENERGY" />
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
      {energyLost ? (
        <>
          <motion.div
            initial={{ opacity: 0, scale: 0.66 }}
            animate={{ opacity: [0, 1, 0], scale: [0.66, 1.22, 1.04] }}
            transition={{ duration: 1.7, ease: "easeOut" }}
            className={cn("absolute z-[190] h-28 w-28 rounded-full bg-violet-400/44 blur-xl", isOpponent ? "left-8 bottom-2" : "right-8 top-2")}
          />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.72 }}
            animate={{ opacity: [0, 0.95, 0], y: [10, -18, -46], scale: [0.72, 1.08, 0.94] }}
            transition={{ duration: 1.55, ease: "easeOut" }}
            className={cn("absolute z-[191] h-16 w-10 rounded-full bg-violet-300/72 blur-md", isOpponent ? "left-11 bottom-4" : "right-11 top-4")}
          />
        </>
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
