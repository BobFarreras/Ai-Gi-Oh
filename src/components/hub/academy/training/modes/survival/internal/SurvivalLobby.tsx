// src/components/hub/academy/training/modes/survival/internal/SurvivalLobby.tsx - Presenta la antesala animada de una expedición Survival.
"use client";
import { motion } from "framer-motion";
import { ISurvivalProgress, ISurvivalRun } from "@/core/entities/survival/ISurvival";
import { TrainingArenaLobbyBackdrop } from "../../classic/internal/TrainingArenaLobbyBackdrop";
import { TrainingArenaCombatantCard } from "../../classic/internal/TrainingArenaCombatantCard";
import { TrainingArenaLobbyActions } from "../../classic/internal/TrainingArenaLobbyActions";

interface ISurvivalLobbyProps {
  run: ISurvivalRun;
  progress: ISurvivalProgress;
  battleIndex: number;
  isResumed: boolean;
  opponentName: string;
  opponentAvatarUrl: string;
  error: string | null;
  onStart: () => void;
  onBack: () => void;
}

export function SurvivalLobby(props: ISurvivalLobbyProps) {
  const nextMilestone = 5 - (props.run.wins % 5);
  return (
    <section className="relative mx-auto flex min-h-dvh w-full items-center justify-center overflow-hidden px-3 py-4 text-cyan-100 md:px-6 md:py-6">
      <TrainingArenaLobbyBackdrop />
      <div className="relative z-10 flex h-[calc(100dvh-2rem)] w-full max-w-6xl flex-col gap-4 pb-24 md:h-auto md:gap-5 md:pb-0">
        <motion.header
          initial={{ y: -22, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.42, ease: "easeOut" }}
          className="overflow-hidden rounded-xl border border-emerald-300/55 bg-[#031d25]/92 shadow-[0_0_28px_rgba(16,185,129,0.25)]"
        >
          <div className="border-b border-emerald-300/20 bg-[linear-gradient(100deg,rgba(16,185,129,0.16),transparent,rgba(34,211,238,0.12))] px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.34em] text-emerald-300">Protocolo de resistencia</p>
            <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
              <h1 className="text-2xl font-black uppercase italic tracking-[0.08em] text-white md:text-4xl">Supervivencia</h1>
              <span className="rounded-md border border-cyan-300/35 bg-cyan-950/55 px-3 py-1 text-xs font-black uppercase tracking-widest">
                Combate {props.battleIndex}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-y divide-emerald-300/15 md:grid-cols-5 md:divide-y-0">
            <SurvivalStat label="LP persistentes" value={`${props.run.currentLp} / ${props.run.maxLp}`} />
            <SurvivalStat label="Victorias" value={String(props.run.wins)} />
            <SurvivalStat label="Récord personal" value={String(props.progress.bestWins)} />
            <SurvivalStat label="Fragmentos" value={String(props.progress.ascensionFragments)} />
            <SurvivalStat label="Próxima curación" value={`En ${nextMilestone}`} />
          </div>
        </motion.header>
        <div className="grid min-h-0 flex-1 grid-cols-1 items-stretch gap-2 md:w-full md:flex-none md:grid-cols-[1fr_auto_1fr] md:gap-4">
          <TrainingArenaCombatantCard alignment="player" name="Arquitecto" imageUrl="/assets/story/player/bob.webp" />
          <motion.div
            className="order-2 mx-auto flex items-center justify-center text-3xl font-black italic tracking-[0.12em] text-emerald-200 md:order-none md:text-5xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            VS
          </motion.div>
          <TrainingArenaCombatantCard alignment="opponent" name={props.opponentName} imageUrl={props.opponentAvatarUrl} />
        </div>
        <p className="text-center text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">
          Los LP que conserves serán los LP iniciales del siguiente combate
        </p>
        {props.error ? <p role="alert" className="text-center text-sm font-bold text-rose-300">{props.error}</p> : null}
        <TrainingArenaLobbyActions
          onStart={props.onStart}
          onBack={props.onBack}
          startLabel={props.isResumed ? "Reanudar Combate" : "Empezar Combate"}
        />
      </div>
    </section>
  );
}

function SurvivalStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-2 py-3 text-center md:px-4">
      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-400 md:text-xs">{label}</p>
      <p className="mt-1 text-base font-black text-emerald-200 md:text-xl">{value}</p>
    </div>
  );
}
