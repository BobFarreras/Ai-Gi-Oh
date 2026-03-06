// src/components/game/board/PlayerHUD.tsx
"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { IPlayer } from "@/core/entities/IPlayer";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { HudFloatingDelta } from "./internal/HudFloatingDelta";

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
}: PlayerHUDProps) {
  const lastProcessedDamageEventId = useRef<string | null>(null);
  const lastProcessedHealEventId = useRef<string | null>(null);
  const [damageTaken, setDamageTaken] = useState<number | null>(null);
  const [healGained, setHealGained] = useState<number | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  // Hook para detectar daño y disparar la animación
  useEffect(() => {
    if (!wasDamagedThisAction) return;
    if (!damagePulseKey || lastProcessedDamageEventId.current === damagePulseKey) {
      return;
    }

    const damage = damageAmount ?? 0;
    if (damage <= 0) {
      return;
    }
    lastProcessedDamageEventId.current = damagePulseKey;
    const startId = setTimeout(() => {
      setDamageTaken(damage);
      setIsShaking(true);
    }, 0);
    const timer = setTimeout(() => {
      setDamageTaken(null);
      setIsShaking(false);
    }, 1500);
    return () => {
      clearTimeout(startId);
      clearTimeout(timer);
    };
  }, [damageAmount, damagePulseKey, wasDamagedThisAction]);

  useEffect(() => {
    if (!wasHealedThisAction) {
      return;
    }
    if (!healPulseKey || lastProcessedHealEventId.current === healPulseKey) {
      return;
    }

    const heal = healAmount ?? 0;
    if (heal <= 0) {
      return;
    }
    lastProcessedHealEventId.current = healPulseKey;

    const startId = setTimeout(() => setHealGained(heal), 0);
    const timer = setTimeout(() => setHealGained(null), 1500);
    return () => {
      clearTimeout(startId);
      clearTimeout(timer);
    };
  }, [healAmount, healPulseKey, wasHealedThisAction]);

  const healthPercentage = Math.max(0, Math.min(100, (player.healthPoints / player.maxHealthPoints) * 100));

  // Animación de vibración de la UI
  const shakeAnimation = isShaking 
    ? { x: isOpponent ? [0, -10, 10, -10, 10, 0] : [0, 10, -10, 10, -10, 0] } 
    : { x: 0 };

  return (
    <motion.div
      initial={{ x: isOpponent ? 50 : -50, opacity: 0 }}
      animate={{ ...shakeAnimation, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "absolute z-[100] flex flex-col w-72 pointer-events-none drop-shadow-2xl transition-all duration-300",
        isActiveTurn ? "scale-[1.02] drop-shadow-[0_0_30px_rgba(34,211,238,0.35)]" : "opacity-80",
        isOpponent ? "top-6 right-6 items-end" : "bottom-6 left-6 items-start"
      )}
    >
      <HudFloatingDelta value={damageTaken} sign="-" isOpponent={isOpponent} color="red" />
      <HudFloatingDelta value={healGained} sign="+" isOpponent={isOpponent} color="blue" />

      <div className="bg-zinc-950/90 border border-zinc-700/50 backdrop-blur-xl px-4 py-1.5 mb-1 relative overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.8)]">
        <div className={cn("absolute inset-0 opacity-20", isOpponent ? "bg-red-500" : "bg-cyan-500")} />
        <div className="flex items-center gap-2">
          <span className="font-black tracking-widest text-white uppercase text-sm drop-shadow-md">{player.name}</span>
          {badgeText && (
            <span className="text-[10px] px-2 py-0.5 border border-amber-300/60 bg-amber-500/20 text-amber-200 rounded uppercase tracking-widest font-black">
              {badgeText}
            </span>
          )}
          {isActiveTurn && (
            <span className="text-[10px] px-2 py-0.5 border border-cyan-300/60 bg-cyan-500/20 text-cyan-200 rounded uppercase tracking-widest font-black animate-pulse">
              Turno Activo
            </span>
          )}
        </div>
      </div>

      <div 
        className="w-full h-8 bg-zinc-950/90 border border-white/10 relative backdrop-blur-xl shadow-inner"
        style={{ clipPath: isOpponent ? "polygon(5% 0, 100% 0, 100% 100%, 0 100%)" : "polygon(0 0, 95% 0, 100% 100%, 0 100%)" }}
      >
        <motion.div 
          className={cn("h-full absolute top-0", isOpponent ? "bg-red-600 right-0" : "bg-cyan-500 left-0")}
          initial={{ width: "100%" }} animate={{ width: `${healthPercentage}%` }} transition={{ type: "spring", stiffness: 100 }}
          style={{ boxShadow: isOpponent ? "0 0 25px rgba(220,38,38,1)" : "0 0 25px rgba(6,182,212,1)" }}
        />
        <div className={cn("absolute top-1 font-black text-white text-lg drop-shadow-[0_2px_4px_rgba(0,0,0,1)]", isOpponent ? "right-6" : "left-6")}>
          {player.healthPoints} LP
        </div>
      </div>

      <div className={cn("flex mt-2 space-x-1", isOpponent ? "justify-end" : "justify-start")}>
        <div className="flex items-center bg-zinc-950/90 border border-yellow-500/50 px-4 py-1.5 rounded-sm shadow-[0_0_15px_rgba(234,179,8,0.2)]">
          <Zap className="w-4 h-4 text-yellow-400 mr-2 drop-shadow-[0_0_5px_rgba(234,179,8,0.8)]" />
          <span className="text-yellow-400 font-black text-sm">{player.currentEnergy} / {player.maxEnergy}</span>
        </div>
      </div>
    </motion.div>
  );
}
