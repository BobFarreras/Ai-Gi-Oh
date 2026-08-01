// src/components/hub/academy/training/modes/olympus/internal/OlympusDebrief.tsx - Informe del duelo legendario, con el bonus de primera victoria destacado.
"use client";
import { motion } from "framer-motion";
import { IOlympusLegend } from "@/core/entities/olympus/IOlympus";
import { IOlympusSettlement } from "../olympus-api-client";

interface IOlympusDebriefProps {
  settlement: IOlympusSettlement;
  legend: IOlympusLegend;
  attemptsRemaining: number;
  isLoading: boolean;
  onContinue: () => void;
  onExit: () => void;
}

const OUTCOME_COPY = {
  WIN: { eyebrow: "Leyenda derrotada", accent: "text-amber-300", border: "border-amber-300/60" },
  LOSS: { eyebrow: "La leyenda resiste", accent: "text-rose-300", border: "border-rose-400/50" },
  DRAW: { eyebrow: "Duelo en tablas", accent: "text-slate-300", border: "border-slate-400/40" },
} as const;

export function OlympusDebrief(props: IOlympusDebriefProps) {
  const copy = OUTCOME_COPY[props.settlement.outcome];
  const { reward } = props.settlement;
  const hasAttempts = props.attemptsRemaining > 0;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[radial-gradient(circle_at_50%_-10%,rgba(168,85,247,0.22),transparent_55%),#0a0513] px-4 py-6">
      <motion.section
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={`w-full max-w-lg overflow-hidden rounded-2xl border ${copy.border} bg-[#150c22]/95 shadow-[0_0_36px_rgba(168,85,247,0.28)]`}
      >
        <div className="border-b border-violet-900/60 bg-[linear-gradient(110deg,rgba(251,191,36,0.12),transparent,rgba(168,85,247,0.16))] px-5 py-4 text-center">
          <p className={`text-[10px] font-black uppercase tracking-[0.32em] ${copy.accent}`}>{copy.eyebrow}</p>
          <h1 className="mt-1 text-3xl font-black uppercase italic tracking-tight text-white">{props.legend.displayName}</h1>
        </div>

        {reward.firstVictory ? (
          <p className="border-b border-amber-400/30 bg-amber-950/30 px-5 py-2.5 text-center text-[11px] font-black uppercase tracking-wider text-amber-200">
            ★ Primera victoria · bonus único de {props.legend.firstVictoryFragmentBonus} de Éter
          </p>
        ) : null}

        <dl className="grid grid-cols-2 divide-x divide-y divide-violet-900/60">
          <Stat label="Éter ganado" value={`+${reward.ascensionFragments}`} highlight />
          <Stat label="Saldo total" value={String(props.settlement.ascensionFragments)} />
          <Stat label="Intentos restantes" value={String(props.attemptsRemaining)} />
          <Stat label="Intento" value={`Nº ${props.settlement.battle.attemptNumber}`} />
        </dl>

        <div className="flex flex-col gap-2 p-4 sm:flex-row-reverse">
          <button
            type="button"
            aria-label={hasAttempts ? "Volver a la selección del Olimpo" : "Volver a Arena"}
            disabled={props.isLoading}
            onClick={hasAttempts ? props.onContinue : props.onExit}
            className="min-h-[48px] flex-1 rounded-xl border border-amber-300/70 bg-[linear-gradient(120deg,rgba(251,191,36,0.28),rgba(168,85,247,0.28))] px-4 text-sm font-black uppercase tracking-wider text-amber-50 transition hover:brightness-125 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
          >
            {hasAttempts ? "Elegir otro desafío" : "Volver a Arena"}
          </button>
          {hasAttempts ? (
            <button
              type="button"
              aria-label="Salir a Arena"
              onClick={props.onExit}
              className="min-h-[48px] rounded-xl border border-slate-600/60 px-4 text-sm font-bold uppercase tracking-wider text-slate-300 transition hover:bg-slate-800/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-300 sm:flex-none"
            >
              Salir
            </button>
          ) : null}
        </div>
      </motion.section>
    </main>
  );
}

function Stat({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="px-4 py-3">
      <dt className="text-[9.5px] font-black uppercase tracking-[0.2em] text-violet-400/70">{label}</dt>
      <dd className={`mt-0.5 text-xl font-black ${highlight ? "text-amber-300" : "text-slate-200"}`}>{value}</dd>
    </div>
  );
}
