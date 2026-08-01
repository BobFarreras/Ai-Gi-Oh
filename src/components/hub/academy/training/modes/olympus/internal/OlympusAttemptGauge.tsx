// src/components/hub/academy/training/modes/olympus/internal/OlympusAttemptGauge.tsx - Intentos restantes del día y cuenta atrás al reset UTC.
"use client";
import { useEffect, useState } from "react";
import { IOlympusAllowance } from "@/core/entities/olympus/IOlympus";

function formatRemaining(milliseconds: number): string {
  const total = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return [hours, minutes, seconds].map((unit) => String(unit).padStart(2, "0")).join(":");
}

/**
 * El servidor manda el instante exacto del reset; aquí solo se cuenta hacia él. Arranca en blanco y se
 * rellena al montar para que el HTML del servidor y el del cliente no discrepen.
 */
export function OlympusAttemptGauge({ allowance }: { allowance: IOlympusAllowance }) {
  const [remaining, setRemaining] = useState<string | null>(null);

  useEffect(() => {
    const resetAtMs = Date.parse(allowance.nextResetIso);
    if (!Number.isFinite(resetAtMs)) return;
    const tick = () => setRemaining(formatRemaining(resetAtMs - Date.now()));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [allowance.nextResetIso]);

  const isExhausted = allowance.attemptsRemaining === 0;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-400/40 bg-[#150c22]/85 px-4 py-3 shadow-[0_0_24px_rgba(217,180,74,0.14)]">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-300/80">Intentos de hoy</p>
        <p aria-live="polite" className={`text-2xl font-black italic tracking-tight ${isExhausted ? "text-rose-300" : "text-amber-100"}`}>
          {allowance.attemptsRemaining}
          <span className="text-base font-bold not-italic text-amber-500/60"> / {allowance.dailyLimit}</span>
        </p>
      </div>

      <div className="flex gap-1.5" role="img" aria-label={`${allowance.attemptsRemaining} de ${allowance.dailyLimit} intentos disponibles`}>
        {Array.from({ length: allowance.dailyLimit }, (_, index) => (
          <span
            key={index}
            className={`h-8 w-2.5 rounded-full border transition-colors ${
              index < allowance.attemptsRemaining
                ? "border-amber-300/70 bg-[linear-gradient(180deg,rgba(251,191,36,0.9),rgba(168,85,247,0.7))] shadow-[0_0_10px_rgba(251,191,36,0.45)]"
                : "border-slate-700/60 bg-slate-900/70"
            }`}
          />
        ))}
      </div>

      <div className="ml-auto text-right">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-300/80">Reset UTC</p>
        {/* `tabular-nums` evita que el ancho baile con cada segundo. */}
        <p className="font-mono text-lg font-black tabular-nums text-violet-100">{remaining ?? "--:--:--"}</p>
      </div>
    </div>
  );
}
