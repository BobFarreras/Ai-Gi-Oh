// src/components/hub/academy/training/modes/survival/internal/SurvivalLobby.tsx - Presenta la antesala animada de una expedición Survival.
"use client";
import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Flame, Swords, Trophy } from "lucide-react";
import { ISurvivalProgress, ISurvivalRun } from "@/core/entities/survival/ISurvival";
import { TrainingArenaLobbyBackdrop } from "../../classic/internal/TrainingArenaLobbyBackdrop";
import { TrainingArenaCombatantCard } from "../../classic/internal/TrainingArenaCombatantCard";
import { TrainingArenaLobbyActions } from "../../classic/internal/TrainingArenaLobbyActions";
import { EterIcon } from "../../EterIcon";
import { SurvivalMilestoneDots, SurvivalVitalsBar } from "./SurvivalVitalsBar";

interface ISurvivalLobbyProps {
  run: ISurvivalRun;
  progress: ISurvivalProgress;
  battleIndex: number;
  milestoneInterval: number;
  milestoneHeal: number;
  isResumed: boolean;
  opponentName: string;
  opponentAvatarUrl: string;
  /** Tier efectivo del rival y vueltas de Ascensión: sin esto no se entiende por qué cuesta más. */
  effectiveTier: number;
  ascensionRank: number;
  aiProfile: string;
  error: string | null;
  notice: string | null;
  onStart: () => void;
  onBack: () => void;
}

/**
 * Cabecera de una sola pieza: el medidor de LP va vertical a un lado y las cifras son icono + valor.
 * Así cabe todo sin desplegables ni rótulos largos, y el resto del alto queda para los retratos, que
 * es lo que de verdad quiere ver el jugador antes de entrar.
 */
export function SurvivalLobby(props: ISurvivalLobbyProps) {
  const difficultyLabel = props.ascensionRank > 0
    ? `T${props.effectiveTier} · Asc ×${props.ascensionRank}`
    : `T${props.effectiveTier}`;

  return (
    <section className="relative mx-auto flex min-h-dvh w-full items-center justify-center overflow-hidden px-3 py-3 text-cyan-100 md:px-6 md:py-6">
      <TrainingArenaLobbyBackdrop />
      <div className="relative z-10 flex h-[calc(100dvh-1.5rem)] w-full max-w-6xl flex-col gap-2.5 pb-28 md:h-auto md:gap-4 md:pb-0">
        <motion.header
          initial={{ y: -18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex shrink-0 gap-3 rounded-xl border border-emerald-300/55 bg-[#031d25]/92 p-2.5 shadow-[0_0_28px_rgba(16,185,129,0.25)] md:gap-4 md:p-3.5"
        >
          <SurvivalVitalsBar
            orientation="vertical"
            currentLp={props.run.currentLp}
            maxLp={props.run.maxLp}
            wins={props.run.wins}
            milestoneInterval={props.milestoneInterval}
            milestoneHeal={props.milestoneHeal}
          />

          <div className="min-w-0 flex-1">
            {/* El rótulo del modo solo cabe cómodo en escritorio; en móvil manda el título a secas. */}
            <p className="hidden text-[10px] font-black uppercase tracking-[0.34em] text-emerald-300 md:block">
              Protocolo de resistencia
            </p>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <h1 className="text-lg font-black uppercase italic tracking-[0.06em] text-white md:text-3xl">Supervivencia</h1>
              <span className="rounded-md border border-cyan-300/35 bg-cyan-950/55 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest md:text-xs">
                Combate {props.battleIndex}
              </span>
              <span className="ml-auto font-mono text-sm font-black tabular-nums text-emerald-200 md:text-lg">
                <span className="hidden text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400 lg:inline">LP </span>
                {props.run.currentLp}
                <span className="text-[10px] font-bold text-zinc-500"> / {props.run.maxLp}</span>
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 md:gap-x-5">
              <IconStat icon={<Trophy size={13} />} value={String(props.run.wins)} label="Victorias" title="Victorias de esta expedición" />
              <IconStat icon={<Swords size={13} />} value={String(props.progress.bestWins)} label="Récord" title="Récord personal" />
              <IconStat icon={<EterIcon size={16} />} value={String(props.progress.ascensionFragments)} label="Éter" title="Éter acumulado" tone="text-violet-300" />
              <IconStat icon={<Flame size={13} />} value={difficultyLabel} label="Rival" title={`Dificultad del rival · IA ${props.aiProfile}`} tone="text-rose-300" />
              <span className="flex items-center gap-1.5">
                <span aria-hidden className="hidden text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400 lg:inline">
                  Curación
                </span>
                <SurvivalMilestoneDots
                  wins={props.run.wins}
                  milestoneInterval={props.milestoneInterval}
                  milestoneHeal={props.milestoneHeal}
                />
              </span>
            </div>
          </div>
        </motion.header>

        <div className="grid min-h-0 flex-1 grid-cols-1 items-stretch gap-2 md:w-full md:flex-none md:grid-cols-[1fr_auto_1fr] md:gap-4">
          <TrainingArenaCombatantCard alignment="player" name="Arquitecto" imageUrl="/assets/story/player/bob.webp" />
          <motion.div
            className="order-2 mx-auto flex items-center justify-center text-2xl font-black italic tracking-[0.12em] text-emerald-200 md:order-none md:text-5xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            VS
          </motion.div>
          <TrainingArenaCombatantCard alignment="opponent" name={props.opponentName} imageUrl={props.opponentAvatarUrl} />
        </div>

        {props.notice ? (
          <p role="status" className="shrink-0 text-center text-xs font-bold text-amber-300">{props.notice}</p>
        ) : null}
        {props.error ? <p role="alert" className="shrink-0 text-center text-xs font-bold text-rose-300">{props.error}</p> : null}

        <TrainingArenaLobbyActions
          onStart={props.onStart}
          onBack={props.onBack}
          startLabel={props.isResumed ? "Reanudar Combate" : "Empezar Combate"}
        />
      </div>
    </section>
  );
}

/**
 * En móvil solo icono y valor, que es donde el ancho aprieta. En escritorio sobra sitio, así que el
 * rótulo se muestra y no hay que adivinar qué significa cada icono.
 */
function IconStat({ icon, value, label, title, tone = "text-emerald-200" }: {
  icon: ReactNode;
  value: string;
  label: string;
  title: string;
  tone?: string;
}) {
  return (
    <span className={`flex items-center gap-1.5 ${tone}`} title={title} aria-label={`${title}: ${value}`}>
      <span aria-hidden className="opacity-80">{icon}</span>
      <span aria-hidden className="hidden text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400 lg:inline">
        {label}
      </span>
      <span className="text-xs font-black tabular-nums md:text-sm">{value}</span>
    </span>
  );
}
