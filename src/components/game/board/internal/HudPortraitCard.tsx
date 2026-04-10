// src/components/game/board/internal/HudPortraitCard.tsx - Tarjeta visual principal del HUD con avatar, LP, energía y badge contextual.
"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import Image from "next/image";
import { IPlayer } from "@/core/entities/IPlayer";
import { cn } from "@/lib/utils";
import { useAnimatedHudValue } from "@/components/game/board/hooks/internal/useAnimatedHudValue";

interface HudPortraitCardProps {
  isOpponent: boolean;
  player: IPlayer;
  isActiveTurn: boolean;
  avatarUrl?: string | null;
  badgeText?: string;
  showEnergy?: boolean;
}

export function HudPortraitCard({ isOpponent, player, isActiveTurn, avatarUrl, badgeText, showEnergy = true }: HudPortraitCardProps) {
  // Animamos LP para que el impacto visual no sea instantáneo.
  const displayedHealthPoints = useAnimatedHudValue(player.healthPoints, 980, 220);
  const healthRatio = Math.max(0, Math.min(1, displayedHealthPoints / Math.max(1, player.maxHealthPoints)));

  return (
    <div
      className={cn(
        "relative w-full h-full bg-zinc-950/80 backdrop-blur-md overflow-hidden",
        isOpponent ? "border-b-2 border-l-2 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.25)] [clip-path:polygon(10%_0,100%_0,100%_100%,0_100%)]" : "border-t-2 border-r-2 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.25)] [clip-path:polygon(0_0,100%_0,90%_100%,0_100%)]",
      )}
    >
      {avatarUrl ? (
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Image
            src={avatarUrl}
            alt="Avatar"
            fill
            sizes="420px"
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-transform duration-700 scale-[1.02]",
              isOpponent ? "object-center translate-x-1.5 -translate-y-1.5" : "object-center -translate-x-1.5 translate-y-1.5",
              isActiveTurn && "scale-[1.06]",
            )}
          />
          <div className={cn("absolute inset-0", isOpponent ? "bg-gradient-to-r from-zinc-950/100 from-15% via-zinc-950/60 via-45% to-transparent" : "bg-gradient-to-l from-zinc-950/100 from-15% via-zinc-950/60 via-45% to-transparent")} />
        </div>
      ) : null}

      <div className={cn("relative z-10 w-full h-full flex flex-col justify-center", isOpponent ? "pl-6 md:pl-10 pr-3 md:pr-4 items-start" : "pr-6 md:pr-10 pl-3 md:pl-4 items-end")}>
        {badgeText ? <span className="mb-1 text-[8px] md:text-[9px] px-1.5 md:px-2 py-0.5 bg-zinc-800/80 text-zinc-300 rounded-sm uppercase tracking-widest font-black border border-zinc-600/50 shadow-sm">{badgeText}</span> : null}
        <div className={cn("flex flex-col w-full", isOpponent ? "items-start" : "items-end")}>
          <div className="flex items-baseline gap-2 drop-shadow-md">
            <span className="text-[clamp(1.35rem,2.7vw,2.25rem)] font-black italic tracking-tighter text-white">{displayedHealthPoints}</span>
            <span className="text-[clamp(0.82rem,1.45vw,1.25rem)] font-bold text-zinc-400">/ {player.maxHealthPoints} LP</span>
          </div>
          <div className={cn("w-[clamp(9.5rem,15vw,15rem)] h-2 md:h-2.5 bg-zinc-900/90 mt-1 relative overflow-hidden shadow-inner", isOpponent ? "[clip-path:polygon(4%_0,100%_0,100%_100%,0_100%)]" : "[clip-path:polygon(0_0,100%_0,96%_100%,0_100%)]")}>
            <motion.div
              initial={false}
              animate={{ width: `${healthRatio * 100}%` }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              className={cn("absolute top-0 bottom-0", isOpponent ? "left-0 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" : "right-0 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]")}
            />
          </div>
        </div>
        {showEnergy ? (
          <div
            className={cn(
              "mt-2 md:mt-3 flex items-center bg-zinc-950/80 border border-yellow-500/30 py-0.5 md:py-1",
              isOpponent ? "pl-3.5 pr-2.5 md:pl-4 md:pr-3 [clip-path:polygon(10%_0,100%_0,100%_100%,0_100%)]" : "px-2.5 md:px-3 [clip-path:polygon(0_0,100%_0,90%_100%,0_100%)]",
            )}
          >
            <Zap className="w-3.5 h-3.5 md:w-4 md:h-4 text-yellow-400 mr-1.5 md:mr-2 drop-shadow-[0_0_5px_rgba(234,179,8,0.8)]" />
            <span className="font-black text-yellow-400 text-[clamp(0.88rem,1.5vw,1.1rem)] italic drop-shadow-md">{player.currentEnergy} <span className="text-[10px] md:text-xs text-yellow-600/80 uppercase">/ {player.maxEnergy}</span></span>
          </div>
        ) : null}
      </div>
      <div className={cn("absolute z-[110] max-w-[72%] truncate px-3 md:px-5 py-1 md:py-1.5 font-black tracking-widest uppercase text-[10px] md:text-xs shadow-lg", isOpponent ? "bg-red-600 top-0 right-0 text-white [clip-path:polygon(0_0,100%_0,100%_100%,15%_100%)]" : "bg-cyan-500 bottom-0 left-0 text-zinc-950 [clip-path:polygon(0_0,85%_0,100%_100%,0_100%)]")}>
        {player.name}
      </div>
    </div>
  );
}
