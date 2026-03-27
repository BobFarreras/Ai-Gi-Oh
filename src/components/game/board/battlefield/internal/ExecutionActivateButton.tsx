// src/components/game/board/battlefield/internal/ExecutionActivateButton.tsx - Botón flotante central y visible para activar ejecución en SET.
"use client";

import { Power } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useBoardPerformanceProfile } from "@/components/game/board/internal/use-board-performance-profile";

interface ExecutionActivateButtonProps {
  onActivateSelectedExecution: () => void;
}

export function ExecutionActivateButton({ onActivateSelectedExecution }: ExecutionActivateButtonProps) {
  const { shouldReduceCombatEffects } = useBoardPerformanceProfile();
  const buttonClassName = cn(
    "absolute left-1/2 top-1/2 z-[125] -translate-x-1/2 -translate-y-1/2",
    "inline-flex items-center gap-3 rounded-full border-2 px-7 py-5 sm:px-9 sm:py-6",
    "bg-zinc-950/92 border-amber-500/70 text-amber-300",
    "font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(251,191,36,0.6)]",
    "transition-all hover:bg-amber-950 hover:border-amber-300 hover:shadow-[0_0_38px_rgba(251,191,36,0.78)]",
  );

  return (
    <motion.button
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.92, opacity: 0 }}
      whileHover={shouldReduceCombatEffects ? { scale: 1 } : { scale: 1.06 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
      aria-label="Activar carta en set"
      onClick={(event) => {
        event.stopPropagation();
        onActivateSelectedExecution();
      }}
      className={buttonClassName}
    >
      <Power className="h-7 w-7 sm:h-9 sm:w-9" />
      <span className="text-base sm:text-lg">Activar</span>
    </motion.button>
  );
}
