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
  avatarUrl?: string | null;
  dialogueMessage?: string | null;
  phase?: string;
  onAdvancePhase?: () => void;
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
  avatarUrl = null,
  dialogueMessage = null,
  phase = "MAIN_1",
  onAdvancePhase,
}: PlayerHUDProps) {
  const { damageTaken, healGained, isShaking } = useHudFeedback(
    wasDamagedThisAction,
    damagePulseKey,
    damageAmount,
    wasHealedThisAction,
    healPulseKey,
    healAmount,
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
      className={cn(
        "absolute z-[100] flex w-[420px] h-[140px] transition-all duration-300 pointer-events-none",
        isOpponent ? "top-0 right-0 justify-start" : "bottom-0 left-0 justify-end"
      )}
    >
      <HudFloatingDelta value={damageTaken} sign="-" isOpponent={isOpponent} color="red" />
      <HudFloatingDelta value={healGained} sign="+" isOpponent={isOpponent} color="blue" />
      <HudDialogueBubble isOpponent={isOpponent} message={dialogueMessage} />
      <HudPortraitCard isOpponent={isOpponent} player={player} isActiveTurn={isActiveTurn} avatarUrl={avatarUrl} badgeText={badgeText} />
      <HudPhaseControls phase={phase} isVisible={!isOpponent && isActiveTurn} onAdvancePhase={onAdvancePhase} />
    </motion.div>
  );
}
