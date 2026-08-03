// src/components/hub/academy/training/modes/olympus/internal/OlympusConfirmDialog.tsx - Confirmación explícita antes de gastar un intento del día.
"use client";
import { useEffect, useRef } from "react";
import { IOlympusLegend } from "@/core/entities/olympus/IOlympus";
import { IOlympusChampionCard } from "../olympus-api-client";
import { describeAiProfile } from "./olympus-labels";

interface IOlympusConfirmDialogProps {
  champion: IOlympusChampionCard;
  legend: IOlympusLegend;
  attemptsRemaining: number;
  isBusy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Un intento gastado no se recupera, así que el paso es deliberado: se enseña qué se enfrenta, qué se
 * gana y cuántos intentos quedarán, y el foco arranca en «Cancelar» para no confirmar por inercia.
 */
export function OlympusConfirmDialog(props: IOlympusConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const { onCancel } = props;

  // Depende solo de `onCancel`: con el objeto de props entero el efecto se repetiría en cada render y
  // robaría el foco continuamente.
  useEffect(() => {
    cancelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#05020a]/85 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="olympus-confirm-title"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-amber-400/50 bg-[#120a1e] shadow-[0_0_40px_rgba(168,85,247,0.35)]"
      >
        <div className="border-b border-amber-400/25 bg-[linear-gradient(110deg,rgba(251,191,36,0.14),transparent,rgba(168,85,247,0.16))] px-5 py-4">
          <p className="font-display text-[10px] font-black uppercase tracking-[0.3em] text-amber-300/80">Vas a gastar un intento</p>
          <h2 id="olympus-confirm-title" className="mt-1 font-display text-2xl font-black uppercase italic tracking-tight text-amber-50">
            {props.champion.displayName} vs {props.legend.displayName}
          </h2>
        </div>

        <dl className="grid grid-cols-2 divide-x divide-y divide-violet-900/60 border-b border-violet-900/60">
          <Detail label="Dificultad" value={describeAiProfile(props.legend.aiProfile)} />
          <Detail label="LP de la leyenda" value={props.legend.startingLp.toLocaleString("es-ES")} />
          <Detail label="Si ganas" value={`${props.legend.baseFragmentReward} de Éter`} />
          <Detail label="Intentos tras esto" value={String(Math.max(0, props.attemptsRemaining - 1))} />
        </dl>

        {/* Las reglas ya no viven en el selector: este es el último punto antes de gastar el intento. */}
        {props.legend.specialRules.length > 0 ? (
          <ul className="space-y-1 border-b border-violet-900/60 px-4 py-3">
            {props.legend.specialRules.map((rule) => (
              <li key={rule} className="flex gap-1.5 text-[11px] leading-snug text-violet-100/90">
                <span aria-hidden className="text-amber-400">◆</span>
                {rule}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="flex flex-col gap-2 p-4 sm:flex-row-reverse">
          <button
            type="button"
            aria-label="Confirmar y empezar el combate"
            disabled={props.isBusy}
            onClick={props.onConfirm}
            className="min-h-[44px] flex-1 rounded-xl border border-amber-300/70 bg-[linear-gradient(120deg,rgba(251,191,36,0.28),rgba(168,85,247,0.28))] px-4 font-display text-sm font-black uppercase tracking-wider text-amber-50 transition hover:brightness-125 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
          >
            {props.isBusy ? "Preparando…" : "Gastar intento y combatir"}
          </button>
          <button
            ref={cancelRef}
            type="button"
            aria-label="Cancelar y volver a la selección"
            disabled={props.isBusy}
            onClick={props.onCancel}
            className="min-h-[44px] rounded-xl border border-slate-600/60 px-4 text-sm font-bold uppercase tracking-wider text-slate-300 transition hover:bg-slate-800/60 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-300 sm:flex-none"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-2.5">
      <dt className="font-display text-[9.5px] font-black uppercase tracking-[0.2em] text-violet-400/70">{label}</dt>
      <dd className="mt-0.5 font-display text-sm font-black text-amber-100">{value}</dd>
    </div>
  );
}
