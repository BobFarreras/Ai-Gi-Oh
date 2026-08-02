// src/components/hub/academy/training/modes/survival/internal/SurvivalDebrief.tsx - Resume una liquidación autoritativa entre combates.
"use client";
import { ReactNode } from "react";
import { motion } from "framer-motion";
import { ISurvivalSettlement } from "../survival-api-client";
import { TrainingArenaLobbyBackdrop } from "../../classic/internal/TrainingArenaLobbyBackdrop";
import { EterIcon } from "../../EterIcon";
import { SurvivalVitalsBar } from "./SurvivalVitalsBar";

interface ISurvivalDebriefProps {
  settlement: ISurvivalSettlement;
  isLoading: boolean;
  error: string | null;
  milestoneInterval: number;
  /** LP con los que se entró al combate: la barra pinta lo perdido antes de asentarse. */
  previousLp?: number;
  onContinue: () => void;
  onExit: () => void;
}

const OUTCOME_THEME = {
  survived: {
    eyebrow: "Sistema superado",
    border: "border-emerald-300/55",
    glow: "shadow-[0_0_60px_rgba(16,185,129,0.28)]",
    accent: "text-emerald-300",
    banner: "from-emerald-500/25 via-transparent to-cyan-500/20",
  },
  draw: {
    eyebrow: "Empate",
    border: "border-amber-300/55",
    glow: "shadow-[0_0_60px_rgba(251,191,36,0.24)]",
    accent: "text-amber-300",
    banner: "from-amber-500/25 via-transparent to-rose-500/15",
  },
  defeat: {
    eyebrow: "Expedición finalizada",
    border: "border-rose-400/55",
    glow: "shadow-[0_0_60px_rgba(244,63,94,0.26)]",
    accent: "text-rose-300",
    banner: "from-rose-600/25 via-transparent to-slate-500/10",
  },
} as const;

/** Presenta únicamente valores derivados por servidor y separa victoria de cierre de run. */
export function SurvivalDebrief(props: ISurvivalDebriefProps) {
  const { settlement } = props;
  const survived = settlement.run.status === "ACTIVE";
  const healedLp = settlement.battle.milestoneHeal;
  const isDraw = settlement.outcome === "DRAW";
  const theme = survived ? OUTCOME_THEME.survived : isDraw ? OUTCOME_THEME.draw : OUTCOME_THEME.defeat;
  const isRecord = settlement.run.wins >= settlement.progress.bestWins && settlement.run.wins > 0;

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#020b11] px-4 py-6 text-cyan-50">
      <TrainingArenaLobbyBackdrop />
      <motion.section
        initial={{ opacity: 0, y: 22, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.38, ease: "easeOut" }}
        className={`relative z-10 w-full max-w-3xl overflow-hidden rounded-2xl border ${theme.border} bg-[#031820]/95 ${theme.glow}`}
      >
        {/* Banda de resultado: el titular ocupa el ancho y se lee antes que cualquier cifra. */}
        <div className={`relative overflow-hidden bg-gradient-to-r ${theme.banner} px-5 py-6 text-center md:px-8`}>
          <motion.p
            initial={{ letterSpacing: "0.6em", opacity: 0 }}
            animate={{ letterSpacing: "0.34em", opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`text-[10px] font-black uppercase ${theme.accent}`}
          >
            Informe de expedición
          </motion.p>
          <motion.h1
            initial={{ scale: 1.15, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.42, delay: 0.08, ease: "easeOut" }}
            className="mt-2 text-3xl font-black uppercase italic tracking-tight text-white md:text-5xl"
          >
            {theme.eyebrow}
          </motion.h1>
          {isDraw ? (
            <p className="mt-2 text-sm font-bold text-amber-300">
              Un empate no permite avanzar: la expedición termina aquí.
            </p>
          ) : null}
          {isRecord && survived ? (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-2 inline-block rounded-full border border-cyan-300/50 bg-cyan-950/60 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200"
            >
              ★ Nuevo récord personal
            </motion.p>
          ) : null}
        </div>

        <div className="space-y-4 p-5 md:p-8">
          {/* La barra va primero: en este modo lo que importa es con cuánta vida sigues. */}
          <SurvivalVitalsBar
            currentLp={settlement.run.currentLp}
            maxLp={settlement.run.maxLp}
            wins={settlement.run.wins}
            milestoneInterval={props.milestoneInterval}
            milestoneHeal={healedLp > 0 ? healedLp : 0}
            previousLp={props.previousLp}
          />

          {healedLp > 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9, duration: 0.4, ease: "easeOut" }}
              className="rounded-xl border border-emerald-300/50 bg-[linear-gradient(100deg,rgba(16,185,129,0.22),transparent)] p-4 text-center"
            >
              <p className="text-sm font-black uppercase tracking-wider text-emerald-300">
                Hito alcanzado · +{healedLp} LP recuperados
              </p>
            </motion.div>
          ) : null}

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <DebriefStat label="Victorias" value={String(settlement.run.wins)} highlight={survived} />
            <DebriefStat label="Récord" value={String(settlement.progress.bestWins)} />
            <DebriefStat label="Éter ganado" value={`+${settlement.reward.ascensionFragments}`} highlight icon={<EterIcon size={16} />} />
            <DebriefStat label="Saldo de Éter" value={String(settlement.progress.ascensionFragments)} icon={<EterIcon size={16} className="opacity-70" />} />
          </div>

          {props.error ? <p role="alert" className="text-center text-sm font-bold text-rose-300">{props.error}</p> : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={props.onExit}
              className="min-h-12 rounded-lg border border-zinc-500/60 px-6 font-black uppercase tracking-wider text-zinc-200 transition hover:bg-zinc-800/60"
            >
              Volver a Arena
            </button>
            {survived ? (
              <motion.button
                type="button"
                disabled={props.isLoading}
                onClick={props.onContinue}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="min-h-12 rounded-lg border border-cyan-200/70 bg-[linear-gradient(110deg,rgba(34,211,238,0.28),rgba(16,185,129,0.24))] px-7 font-black uppercase tracking-wider text-cyan-50 transition hover:brightness-125 disabled:opacity-50"
              >
                {props.isLoading ? "Preparando…" : "Siguiente combate"}
              </motion.button>
            ) : null}
          </div>
        </div>
      </motion.section>
    </main>
  );
}

function DebriefStat({ label, value, highlight = false, icon = null }: {
  label: string;
  value: string;
  highlight?: boolean;
  icon?: ReactNode;
}) {
  return (
    <div className={`rounded-lg border p-3 text-center ${highlight ? "border-cyan-300/40 bg-cyan-950/50" : "border-cyan-300/20 bg-cyan-950/30"}`}>
      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">{label}</p>
      <p className={`mt-1 flex items-center justify-center gap-1 text-lg font-black ${highlight ? "text-cyan-100" : "text-cyan-200/80"}`}>
        {icon}
        {value}
      </p>
    </div>
  );
}
