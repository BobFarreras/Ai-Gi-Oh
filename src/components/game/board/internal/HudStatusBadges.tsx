// src/components/game/board/internal/HudStatusBadges.tsx - Badges de estado del HUD (escudo anti-ataque directo,
// infección por turno, regeneración por turno). Compartido por el HUD desktop y el dock de energía móvil.
"use client";

import { motion } from "framer-motion";
import { Biohazard, HeartPulse, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface HudStatusBadgesProps {
  /** Turnos restantes de escudo "sin ataques directos" (null = sin escudo). */
  shieldTurns?: number | null;
  /** Daño por turno de "infección" (Bandera Windows); null = no infectado. */
  infectionAmount?: number | null;
  /** Curación por turno de "regeneración" (Abrazo Hugging); null = sin regeneración. */
  regenAmount?: number | null;
  /** compact: tamaños fijos pequeños para el dock móvil; por defecto tamaños responsive del HUD. */
  compact?: boolean;
  className?: string;
}

const BADGE_BASE = "flex items-center gap-1 rounded-sm border bg-zinc-950/80";

export function HudStatusBadges({ shieldTurns = null, infectionAmount = null, regenAmount = null, compact = false, className }: HudStatusBadgesProps) {
  if (shieldTurns == null && infectionAmount == null && regenAmount == null) return null;
  const iconClass = compact ? "h-3.5 w-3.5" : "w-3.5 h-3.5 md:w-4 md:h-4";
  const textClass = compact ? "text-[11px]" : "text-[clamp(0.82rem,1.4vw,1.05rem)]";
  const padClass = compact ? "px-1.5 py-0.5" : "px-2 py-0.5 md:py-1";
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {shieldTurns != null ? (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} title="Protegido de ataques directos"
          className={cn(BADGE_BASE, padClass, "border-cyan-400/40 shadow-[0_0_10px_rgba(34,211,238,0.35)]")}>
          <ShieldCheck className={cn(iconClass, "text-cyan-300 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]")} />
          <span className={cn("font-black italic text-cyan-200", textClass)}>{shieldTurns}</span>
        </motion.div>
      ) : null}
      {infectionAmount != null ? (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} title={`Infectado: -${infectionAmount} LP por turno`}
          className={cn(BADGE_BASE, padClass, "border-fuchsia-400/40 shadow-[0_0_10px_rgba(217,70,239,0.35)]")}>
          <Biohazard className={cn(iconClass, "text-fuchsia-300 drop-shadow-[0_0_5px_rgba(217,70,239,0.85)]")} />
          {/* En móvil (compact) solo el icono; la cantidad se ve en la descripción de la carta. */}
          {compact ? null : <span className={cn("font-black italic text-fuchsia-200", textClass)}>{infectionAmount}</span>}
        </motion.div>
      ) : null}
      {regenAmount != null ? (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} title={`Regeneración: +${regenAmount} LP por turno`}
          className={cn(BADGE_BASE, padClass, "border-emerald-400/40 shadow-[0_0_10px_rgba(16,185,129,0.35)]")}>
          <HeartPulse className={cn(iconClass, "text-emerald-300 drop-shadow-[0_0_5px_rgba(16,185,129,0.85)]")} />
          {compact ? null : <span className={cn("font-black italic text-emerald-200", textClass)}>{regenAmount}</span>}
        </motion.div>
      ) : null}
    </div>
  );
}
