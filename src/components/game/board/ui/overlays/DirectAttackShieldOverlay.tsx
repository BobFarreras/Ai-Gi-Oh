// src/components/game/board/ui/overlays/DirectAttackShieldOverlay.tsx - Barrera luminosa + contador de
// turnos para el estado "sin ataques directos" (Firewall Fortaleza). Se muestra en la mitad del jugador
// PROTEGIDO (el escudo dura mientras su rival esté bloqueado).
"use client";

import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { IActiveStatusEffect } from "@/core/entities/IStatusEffect";
import { cn } from "@/lib/utils";

interface DirectAttackShieldOverlayProps {
  statusEffects: readonly IActiveStatusEffect[] | undefined;
  /** Id del jugador local (mitad inferior del tablero). */
  playerId: string;
  /** Id del rival (mitad superior del tablero). */
  opponentId: string;
}

function ShieldBarrier({ side }: { side: "top" | "bottom" }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-x-0 z-0 flex flex-col items-center",
        side === "top" ? "top-[9%]" : "bottom-[9%] flex-col-reverse",
      )}
    >
      {/* Halo/barrera luminosa */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0.6 }}
        animate={{ opacity: [0.4, 0.85, 0.4], scaleX: 1 }}
        transition={{ opacity: { duration: 2.2, repeat: Infinity, ease: "easeInOut" }, scaleX: { duration: 0.5, ease: "easeOut" } }}
        className="mx-auto h-16 w-[62%] rounded-[100%] bg-gradient-to-b from-cyan-400/30 via-sky-400/12 to-transparent blur-lg"
      />
      <motion.div
        animate={{ opacity: [0.65, 1, 0.65] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        className="mx-auto -mt-6 h-[3px] w-[58%] rounded-full bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_26px_rgba(34,211,238,0.95)]"
      />
    </div>
  );
}

function ShieldCounter({ side, turns }: { side: "top" | "bottom"; turns: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: side === "top" ? -6 : 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "pointer-events-none absolute left-1/2 z-[5] -translate-x-1/2",
        side === "top" ? "top-[2%]" : "bottom-[2%]",
      )}
    >
      <span className="flex items-center gap-1.5 rounded-full border border-cyan-300/60 bg-[#02121f]/90 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.55)] backdrop-blur-sm">
        <ShieldCheck size={13} className="text-cyan-300" />
        Escudo · {turns} {turns === 1 ? "turno" : "turnos"}
      </span>
    </motion.div>
  );
}

export function DirectAttackShieldOverlay({ statusEffects, playerId, opponentId }: DirectAttackShieldOverlayProps) {
  const effects = statusEffects ?? [];
  // El jugador está protegido cuando su RIVAL tiene el bloqueo de ataques directos.
  const playerShield = effects.find((status) => status.kind === "NO_DIRECT_ATTACKS" && status.targetPlayerId === opponentId);
  const opponentShield = effects.find((status) => status.kind === "NO_DIRECT_ATTACKS" && status.targetPlayerId === playerId);
  if (!playerShield && !opponentShield) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-0">
      {opponentShield ? (
        <>
          <ShieldBarrier side="top" />
          {opponentShield.remainingTurns != null ? <ShieldCounter side="top" turns={opponentShield.remainingTurns} /> : null}
        </>
      ) : null}
      {playerShield ? (
        <>
          <ShieldBarrier side="bottom" />
          {playerShield.remainingTurns != null ? <ShieldCounter side="bottom" turns={playerShield.remainingTurns} /> : null}
        </>
      ) : null}
    </div>
  );
}
