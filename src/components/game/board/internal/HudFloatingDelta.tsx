// src/components/game/board/internal/HudFloatingDelta.tsx - Delta flotante de HUD con modo liviano en dispositivos con menos rendimiento.
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useBoardPerformanceProfile } from "@/components/game/board/internal/use-board-performance-profile";

interface HudFloatingDeltaProps {
  value: number | null;
  sign: "+" | "-";
  isOpponent: boolean;
  color: "red" | "blue";
}

export function HudFloatingDelta({ value, sign, isOpponent, color }: HudFloatingDeltaProps) {
  const isRed = color === "red";
  const { shouldReduceCombatEffects } = useBoardPerformanceProfile();

  if (value === null) return null;

  if (shouldReduceCombatEffects) {
    return (
      <div
        className={cn(
          "absolute z-[200] text-2xl font-black",
          isRed ? "text-red-500" : "text-blue-400",
          isOpponent ? "bottom-[-24px]" : "top-[-24px]",
        )}
      >
        {sign}
        {value}
      </div>
    );
  }

  return (
    <AnimatePresence>
      {(
        <motion.div
          initial={{ opacity: 0, y: 0, scale: 0.5 }}
          animate={{ opacity: 1, y: isOpponent ? 40 : -40, scale: 1.45 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className={cn(
            "absolute font-black text-4xl z-[200]",
            isRed ? "drop-shadow-[0_0_20px_rgba(239,68,68,1)] text-red-500" : "drop-shadow-[0_0_20px_rgba(96,165,250,1)] text-blue-400",
            isOpponent ? "bottom-[-40px]" : "top-[-40px]",
          )}
        >
          {sign}
          {value}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

