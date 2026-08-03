// src/components/hub/academy/training/modes/survival/internal/SurvivalVitalsBar.tsx - Medidor de LP persistentes y avance hacia el hito.
"use client";
import { motion } from "framer-motion";
import { resolveSurvivalProgress } from "./survival-progress";

interface ISurvivalVitalsBarProps {
  currentLp: number;
  maxLp: number;
  wins: number;
  milestoneInterval: number;
  milestoneHeal: number;
  /** LP con los que se entró al combate anterior: pinta el tramo perdido como estela. */
  previousLp?: number;
  /** Vertical para el lateral de la cabecera; horizontal para el informe. */
  orientation?: "horizontal" | "vertical";
}

/**
 * Los LP que conservas son la mecánica del modo, así que el medidor es el elemento gráfico principal y
 * no necesita rótulo que lo explique. El tramo fantasma anticipa lo que devolverá el próximo hito.
 */
export function SurvivalVitalsBar(props: ISurvivalVitalsBarProps) {
  const readout = resolveSurvivalProgress(props);
  const lostRatio = props.previousLp !== undefined && props.previousLp > props.currentLp
    ? Math.min(1, (props.previousLp - props.currentLp) / Math.max(1, props.maxLp))
    : 0;
  const fillColor = readout.isCritical
    ? "from-rose-500 via-rose-400 to-amber-400"
    : "from-emerald-400 via-teal-300 to-cyan-300";
  const label = `${props.currentLp} de ${props.maxLp} LP`;

  if (props.orientation === "vertical") {
    return (
      <div
        role="img"
        aria-label={label}
        className="relative h-full w-2.5 shrink-0 overflow-hidden rounded-full border border-emerald-300/30 bg-[#04141a]"
      >
        {readout.healPreviewRatio > 0 ? (
          <div
            className="absolute inset-x-0 border-b border-emerald-300/40 bg-emerald-400/15"
            style={{ bottom: `${readout.lpRatio * 100}%`, height: `${readout.healPreviewRatio * 100}%` }}
          />
        ) : null}
        <motion.div
          className={`absolute inset-x-0 bottom-0 rounded-full bg-gradient-to-t ${fillColor}`}
          initial={{ height: `${(readout.lpRatio + lostRatio) * 100}%` }}
          animate={{ height: `${readout.lpRatio * 100}%` }}
          transition={{ duration: 0.7, delay: 0.25, ease: "easeOut" }}
        />
      </div>
    );
  }

  return (
    <section aria-label="Estado de la expedición" className="w-full">
      <div className="mb-1 flex items-end justify-between gap-2">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300/90">LP persistentes</p>
        <p className={`font-mono text-sm font-black tabular-nums ${readout.isCritical ? "text-rose-300" : "text-emerald-200"}`}>
          {props.currentLp}
          <span className="text-[11px] font-bold text-zinc-500"> / {props.maxLp}</span>
        </p>
      </div>
      <div className="relative h-5 w-full overflow-hidden rounded-full border border-emerald-300/30 bg-[#04141a]">
        {readout.healPreviewRatio > 0 ? (
          <div
            className="absolute inset-y-0 border-l border-emerald-300/40 bg-emerald-400/15"
            style={{ left: `${readout.lpRatio * 100}%`, width: `${readout.healPreviewRatio * 100}%` }}
          />
        ) : null}
        {lostRatio > 0 ? (
          <motion.div
            className="absolute inset-y-0 bg-rose-500/35"
            initial={{ width: `${lostRatio * 100}%` }}
            animate={{ width: 0 }}
            transition={{ duration: 0.9, delay: 0.35, ease: "easeOut" }}
            style={{ left: `${readout.lpRatio * 100}%` }}
          />
        ) : null}
        <motion.div
          className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${fillColor}`}
          initial={{ width: `${(readout.lpRatio + lostRatio) * 100}%` }}
          animate={{ width: `${readout.lpRatio * 100}%` }}
          transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
        />
      </div>
    </section>
  );
}

/** Puntos de avance hacia la curación: se leen de un vistazo y no gastan una línea de texto. */
export function SurvivalMilestoneDots({ wins, milestoneInterval, milestoneHeal }: {
  wins: number;
  milestoneInterval: number;
  milestoneHeal: number;
}) {
  if (milestoneInterval <= 0) return null;
  const readout = resolveSurvivalProgress({ currentLp: 1, maxLp: 1, wins, milestoneInterval, milestoneHeal });
  return (
    <span
      className="flex items-center gap-1"
      title={`Curación de ${milestoneHeal} LP dentro de ${readout.winsToMilestone} victoria(s)`}
      role="img"
      aria-label={`${readout.winsIntoMilestone} de ${milestoneInterval} victorias hacia la curación de ${milestoneHeal} LP`}
    >
      {Array.from({ length: milestoneInterval }, (_, index) => (
        <span
          key={index}
          className={`h-1.5 w-3 rounded-full ${
            index < readout.winsIntoMilestone
              ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]"
              : "bg-emerald-950 ring-1 ring-emerald-800/70"
          }`}
        />
      ))}
    </span>
  );
}
