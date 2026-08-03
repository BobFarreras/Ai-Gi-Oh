// src/components/hub/academy/training/modes/olympus/internal/OlympusAttemptGauge.tsx - Intentos restantes del día y cuenta atrás al reset UTC.
"use client";
import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { IOlympusAllowance } from "@/core/entities/olympus/IOlympus";
import { EterIcon } from "../../EterIcon";

function formatRemaining(milliseconds: number): string {
  const total = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return [hours, minutes, seconds].map((unit) => String(unit).padStart(2, "0")).join(":");
}

/**
 * Compacto a propósito: cabe en la fila de cabecera junto al título, igual que las cifras de
 * Supervivencia. El servidor manda el instante del reset; aquí solo se cuenta hacia él, y se rellena
 * al montar para que el HTML del servidor y el del cliente no discrepen.
 */
export function OlympusAttemptGauge({ allowance, ascensionFragments }: {
  allowance: IOlympusAllowance;
  ascensionFragments: number;
}) {
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
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 md:gap-x-5">
      <span
        className="flex items-center gap-1.5"
        role="img"
        aria-label={`${allowance.attemptsRemaining} de ${allowance.dailyLimit} intentos disponibles`}
      >
        <span aria-hidden className="hidden text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 lg:inline">
          Intentos
        </span>
        <span className="flex gap-1">
          {Array.from({ length: allowance.dailyLimit }, (_, index) => (
            <span
              key={index}
              className={`h-4 w-2 rounded-full border transition-colors ${
                index < allowance.attemptsRemaining
                  ? "border-amber-300/70 bg-[linear-gradient(180deg,rgba(251,191,36,0.95),rgba(168,85,247,0.75))] shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                  : "border-slate-700/60 bg-slate-900/70"
              }`}
            />
          ))}
        </span>
        <span className={`text-xs font-black tabular-nums md:text-sm ${isExhausted ? "text-rose-300" : "text-amber-100"}`}>
          {allowance.attemptsRemaining}
          <span className="text-[10px] font-bold text-amber-500/60">/{allowance.dailyLimit}</span>
        </span>
      </span>

      <span className="flex items-center gap-1.5 text-violet-200" title="Éter acumulado" aria-label={`Éter acumulado: ${ascensionFragments}`}>
        <EterIcon size={16} />
        <span aria-hidden className="hidden text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 lg:inline">Éter</span>
        <span className="text-xs font-black tabular-nums md:text-sm">{ascensionFragments}</span>
      </span>

      <span className="flex items-center gap-1.5 text-violet-300" title="Los intentos se reinician a las 00:00 UTC">
        <Timer aria-hidden size={13} className="opacity-80" />
        <span aria-hidden className="hidden text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 lg:inline">Reset</span>
        {/* `tabular-nums` evita que el ancho baile con cada segundo. */}
        <span className="font-mono text-xs font-black tabular-nums md:text-sm">{remaining ?? "--:--:--"}</span>
      </span>
    </div>
  );
}
