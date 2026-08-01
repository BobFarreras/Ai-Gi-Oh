// src/components/hub/academy/training/modes/survival/internal/SurvivalDebrief.tsx - Resume una liquidación autoritativa entre combates.
"use client";
import { motion } from "framer-motion";
import { ISurvivalSettlement } from "../survival-api-client";
import { TrainingArenaLobbyBackdrop } from "../../classic/internal/TrainingArenaLobbyBackdrop";

interface ISurvivalDebriefProps {
  settlement: ISurvivalSettlement;
  isLoading: boolean;
  error: string | null;
  onContinue: () => void;
  onExit: () => void;
}

/** Presenta únicamente valores derivados por servidor y separa victoria de cierre de run. */
export function SurvivalDebrief({
  settlement,
  isLoading,
  error,
  onContinue,
  onExit,
}: ISurvivalDebriefProps) {
  const survived = settlement.run.status === "ACTIVE";
  const healedLp = settlement.battle.milestoneHeal;
  // Un empate no es una victoria: cierra la expedición igual que una derrota y conviene decirlo.
  const isDraw = settlement.outcome === "DRAW";
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#020b11] px-4 py-6 text-cyan-50">
      <TrainingArenaLobbyBackdrop />
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: "easeOut" }}
        className="relative z-10 w-full max-w-3xl rounded-2xl border border-cyan-300/45 bg-[#031820]/95 p-5 shadow-[0_0_45px_rgba(6,182,212,0.2)] md:p-8"
      >
        <p className="text-center text-[10px] font-black uppercase tracking-[0.34em] text-cyan-300">
          Informe de expedición
        </p>
        <h1 className="mt-2 text-center text-3xl font-black uppercase italic text-white md:text-5xl">
          {survived ? "Sistema superado" : isDraw ? "Empate" : "Expedición finalizada"}
        </h1>
        {isDraw ? (
          <p className="mt-2 text-center text-sm font-bold text-amber-300">
            Un empate no permite avanzar: la expedición termina aquí.
          </p>
        ) : null}
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <DebriefStat label="Victorias" value={String(settlement.run.wins)} />
          <DebriefStat label="Récord" value={String(settlement.progress.bestWins)} />
          <DebriefStat label="LP actuales" value={`${settlement.run.currentLp} / ${settlement.run.maxLp}`} />
          <DebriefStat label="Éter" value={`+${settlement.reward.ascensionFragments}`} />
        </div>
        <div className="mt-4 rounded-xl border border-emerald-300/25 bg-emerald-950/25 p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-300">
            Saldo de Ascensión: {settlement.progress.ascensionFragments}
          </p>
          {healedLp > 0 ? (
            <p className="mt-2 text-sm font-black uppercase text-emerald-300">
              Hito alcanzado · +{healedLp} LP recuperados
            </p>
          ) : null}
        </div>
        {error ? <p role="alert" className="mt-4 text-center text-sm font-bold text-rose-300">{error}</p> : null}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onExit}
            className="min-h-12 rounded-lg border border-zinc-500/60 px-6 font-black uppercase tracking-wider text-zinc-200"
          >
            Volver a Arena
          </button>
          {survived ? (
            <button
              type="button"
              disabled={isLoading}
              onClick={onContinue}
              className="min-h-12 rounded-lg border border-cyan-200/70 bg-cyan-400/15 px-7 font-black uppercase tracking-wider text-cyan-100 disabled:opacity-50"
            >
              {isLoading ? "Preparando…" : "Siguiente combate"}
            </button>
          ) : null}
        </div>
      </motion.section>
    </main>
  );
}

function DebriefStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-cyan-300/20 bg-cyan-950/35 p-3 text-center">
      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">{label}</p>
      <p className="mt-1 text-lg font-black text-cyan-100">{value}</p>
    </div>
  );
}
