// src/components/game/board/internal/BoardMobileEnergyBadge.tsx - Renderiza la energía del jugador en móvil separada del HUD para evitar solapamientos.
"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";

interface BoardMobileEnergyBadgeProps {
  currentEnergy: number;
  maxEnergy: number;
  isPlayerTurn: boolean;
  dockLeftPx?: number;
  bottomPx?: number;
}

export function BoardMobileEnergyBadge({
  currentEnergy,
  maxEnergy,
  isPlayerTurn,
  dockLeftPx = 188,
  bottomPx = 10,
}: BoardMobileEnergyBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="pointer-events-none absolute z-[290] flex h-9 max-w-[calc(100vw-16px)] items-center gap-1.5 border border-yellow-500/45 bg-zinc-950/88 px-2.5 text-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.25)]"
      style={{ left: `${dockLeftPx}px`, bottom: `${bottomPx}px` }}
    >
      <Zap className={`h-3.5 w-3.5 ${isPlayerTurn ? "text-yellow-300" : "text-yellow-500/75"}`} />
      <span className="text-[11px] font-black uppercase tracking-widest">
        EN
      </span>
      <span className="text-sm font-black italic">
        {currentEnergy}
      </span>
      <span className="text-[10px] font-bold text-yellow-600/80">
        / {maxEnergy}
      </span>
    </motion.div>
  );
}
