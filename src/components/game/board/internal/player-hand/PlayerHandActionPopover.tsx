// src/components/game/board/internal/player-hand/PlayerHandActionPopover.tsx - Popover de acciones contextuales para carta seleccionada en mano.
"use client";

import { motion } from "framer-motion";
import { BattleMode } from "@/core/entities/IPlayer";
import { Box, Shield, Sword, Zap } from "lucide-react";

interface IPlayerHandActionPopoverProps {
  isBlocked: boolean;
  isEntityOrFusion: boolean;
  isFusion: boolean;
  isTrap: boolean;
  onPlayAction: (mode: BattleMode, e: React.MouseEvent) => void;
}

export function PlayerHandActionPopover({ isBlocked, isEntityOrFusion, isFusion, isTrap, onPlayAction }: IPlayerHandActionPopoverProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: -20, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.8 }}
      className="absolute -top-16 left-1/2 -translate-x-1/2 z-[100] flex gap-2 bg-zinc-950/90 p-2 rounded-xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,1)] backdrop-blur-md whitespace-nowrap pointer-events-auto"
    >
      {isBlocked ? (
        <span className="text-red-400 font-mono text-xs px-4 py-2 uppercase tracking-widest font-bold bg-red-950/40 rounded border border-red-500/20">Límite Alcanzado</span>
      ) : isEntityOrFusion ? (
        <>
          <button onClick={(e) => onPlayAction("ATTACK", e)} className="flex items-center gap-1.5 px-4 py-2 bg-red-950/40 hover:bg-red-900 border border-red-500/50 text-red-400 text-xs font-black rounded-lg transition-all"><Sword size={16} /> {isFusion ? "FUSIÓN ATQ" : "ATAQUE"}</button>
          <button onClick={(e) => onPlayAction("DEFENSE", e)} className="flex items-center gap-1.5 px-4 py-2 bg-blue-950/40 hover:bg-blue-900 border border-blue-500/50 text-blue-400 text-xs font-black rounded-lg transition-all"><Shield size={16} /> {isFusion ? "FUSIÓN DEF" : "DEFENSA"}</button>
        </>
      ) : isTrap ? (
        <button onClick={(e) => onPlayAction("SET", e)} className="flex items-center gap-1.5 px-4 py-2 bg-purple-950/40 hover:bg-purple-900 border border-purple-500/50 text-purple-300 text-xs font-black rounded-lg transition-all"><Box size={16} /> ARMAR TRAMPA</button>
      ) : (
        <>
          <button onClick={(e) => onPlayAction("ACTIVATE", e)} className="flex items-center gap-1.5 px-4 py-2 bg-cyan-950/40 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-400 text-xs font-black rounded-lg transition-all"><Zap size={16} /> ACTIVAR</button>
          <button onClick={(e) => onPlayAction("SET", e)} className="flex items-center gap-1.5 px-4 py-2 bg-purple-950/40 hover:bg-purple-900 border border-purple-500/50 text-purple-400 text-xs font-black rounded-lg transition-all"><Box size={16} /> SET (OCULTAR)</button>
        </>
      )}
    </motion.div>
  );
}
