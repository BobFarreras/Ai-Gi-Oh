// src/components/hub/academy/training/modes/arena/internal/TrainingArenaLobby.tsx - Pantalla previa de arena con presentación Jugador vs Oponente y CTA de inicio.
"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { TrainingArenaLobbyBackdrop } from "@/components/hub/academy/training/modes/arena/internal/TrainingArenaLobbyBackdrop";
import { AcademyBackButton } from "@/components/hub/academy/AcademyBackButton";

interface ITrainingArenaLobbyProps {
  level: number;
  tierCode: string;
  tierDifficultyLabel: string;
  tierRewardPreview: { nexus: number; playerExperience: number };
  nextTierRequirementLabel: string;
  opponentName: string;
  playerAvatarUrl: string;
  opponentAvatarUrl: string;
  onStart: () => void;
  onBack: () => void;
}

/**
 * Presenta el duelo antes de cargar el tablero para reforzar identidad de tier y rival.
 */
export function TrainingArenaLobby(props: ITrainingArenaLobbyProps) {
  return (
    <section className="relative mx-auto flex min-h-dvh w-full items-center justify-center overflow-hidden px-3 py-4 text-cyan-100 md:overflow-y-visible md:px-6 md:py-6">
      <TrainingArenaLobbyBackdrop />
      <div className="relative z-10 flex h-[calc(100dvh-2rem)] w-full max-w-6xl flex-col gap-4 pb-24 md:h-auto md:gap-5 md:pb-0">
        <motion.header
          initial={{ y: -22, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.42, ease: "easeOut" }}
          className="relative overflow-hidden rounded-xl border border-cyan-300/55 bg-[#03172a]/90 px-3 py-2.5 shadow-[0_0_22px_rgba(34,211,238,0.24)] md:px-4 lg:px-5"
        >
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(34,211,238,0.08),transparent_50%,rgba(167,139,250,0.08))]" />
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-[-20%] w-[20%] bg-[linear-gradient(90deg,transparent,rgba(34,211,238,0.24),transparent)]"
            animate={{ x: ["0%", "620%"] }}
            transition={{ duration: 2.6, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          />
          <div className="relative flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-black uppercase tracking-[0.14em] text-cyan-100 md:gap-x-3.5 md:text-[12px] lg:text-[13px]">
            <span className="text-cyan-300 md:text-[13px] lg:text-[14px]">Arena Nivel {props.level}</span>
            <span className="h-1 w-1 rounded-full bg-cyan-300/80" />
            <span className="inline-flex items-center gap-1">
              <svg className="h-3.5 w-3.5 text-cyan-300 md:h-4 md:w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2 3 6v8l7 4 7-4V6l-7-4Zm0 2.3 4.8 2.75L10 9.8 5.2 7.05 10 4.3Z" /></svg>
              <span>{props.tierDifficultyLabel}</span>
            </span>
            <span className="h-1 w-1 rounded-full bg-cyan-300/80" />
            <span className="inline-flex items-center gap-1">
              <svg className="h-3.5 w-3.5 text-cyan-300 md:h-4 md:w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a8 8 0 1 0 8 8h-2a6 6 0 1 1-6-6V2Z" /></svg>
              <span>Tier {props.tierCode}</span>
            </span>
            <span className="h-1 w-1 rounded-full bg-emerald-300/80" />
            <span className="inline-flex items-center gap-1 text-emerald-200">
              <svg className="h-3.5 w-3.5 md:h-4 md:w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2 5 10h4l-1 8 7-10h-4l1-6Z" /></svg>
              <span>XP +{props.tierRewardPreview.playerExperience}</span>
            </span>
            <span className="h-1 w-1 rounded-full bg-violet-300/80" />
            <span className="inline-flex items-center gap-1 text-violet-200">
              <svg className="h-3.5 w-3.5 md:h-4 md:w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 1 3 5v6c0 4.4 3 7.9 7 8.9 4-1 7-4.5 7-8.9V5l-7-4Z" /></svg>
              <span>Nexus +{props.tierRewardPreview.nexus}</span>
            </span>
          </div>
          <div className="relative mt-1 text-center text-[11px] font-semibold tracking-[0.08em] text-cyan-100/85 md:text-[12px] lg:text-[13px]">
            {props.nextTierRequirementLabel}
          </div>
        </motion.header>
        <div className="grid min-h-0 flex-1 grid-cols-1 items-stretch gap-2 md:w-full md:flex-none md:grid-cols-[1fr_auto_1fr] md:gap-4">
          <motion.article
            initial={{ x: -34, y: 20, opacity: 0 }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            transition={{ duration: 0.46, ease: "easeOut", delay: 0.08 }}
            className="relative order-1 flex min-h-0 flex-col rounded-2xl border border-cyan-300/45 bg-[#05192d]/90 p-2.5 shadow-[0_0_24px_rgba(34,211,238,0.28)] md:order-none md:block md:p-3"
          >
            <div className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l border-t border-cyan-300/55" />
            <div className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 border-b border-r border-cyan-300/55" />
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Jugador</p>
            <div className="mt-2 flex min-h-0 flex-1 rounded-xl border border-cyan-200/30 bg-[linear-gradient(160deg,rgba(7,35,57,0.92),rgba(4,16,30,0.88))] p-1.5 md:block">
              <div className="h-full w-full overflow-hidden rounded-lg border border-cyan-100/25 bg-[#020a13] md:aspect-[4/3] md:h-auto">
                <Image src={props.playerAvatarUrl} alt="Avatar del jugador" width={540} height={720} className="h-full w-full object-cover object-center" priority />
              </div>
            </div>
          </motion.article>
          <div className="mx-auto order-2 flex flex-col items-center justify-center gap-1 self-center px-0.5 text-center md:order-none md:px-2">
            <motion.p
              className="text-3xl font-black uppercase tracking-[0.12em] text-cyan-100 md:text-5xl"
              animate={{ scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] }}
              transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            >
              VS
            </motion.p>
          </div>
          <motion.article
            initial={{ x: 34, y: 20, opacity: 0 }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            transition={{ duration: 0.46, ease: "easeOut", delay: 0.14 }}
            className="relative order-3 flex min-h-0 flex-col rounded-2xl border border-rose-300/45 bg-[#230b17]/90 p-2.5 shadow-[0_0_24px_rgba(251,113,133,0.25)] md:order-none md:block md:p-3"
          >
            <div className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l border-t border-rose-300/55" />
            <div className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 border-b border-r border-rose-300/55" />
            <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-200">{props.opponentName}</p>
            <div className="mt-2 flex min-h-0 flex-1 rounded-xl border border-rose-200/35 bg-[linear-gradient(160deg,rgba(62,18,40,0.9),rgba(30,8,20,0.9))] p-1.5 md:block">
              <div className="h-full w-full overflow-hidden rounded-lg border border-rose-100/25 bg-[#13040d] md:aspect-[4/3] md:h-auto">
                <Image src={props.opponentAvatarUrl} alt={`Avatar de ${props.opponentName}`} width={540} height={720} className="h-full w-full object-cover object-center" priority />
              </div>
            </div>
          </motion.article>
        </div>
        <motion.div
          initial={{ y: 18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.42, ease: "easeOut", delay: 0.22 }}
          className="hidden flex-col items-center gap-2 md:flex"
        >
          <motion.button
            type="button"
            onClick={props.onStart}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            animate={{ boxShadow: ["0 0 0 rgba(16,185,129,0.0)", "0 0 24px rgba(16,185,129,0.45)", "0 0 0 rgba(16,185,129,0.0)"] }}
            transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            className="w-full max-w-md rounded-xl border border-emerald-300/70 bg-emerald-500/20 px-7 py-2.5 text-sm font-black uppercase tracking-[0.15em] text-emerald-100 hover:bg-emerald-400/30"
          >
            Empezar Combate
          </motion.button>
          <AcademyBackButton label="Volver a Academy" onClick={props.onBack} />
        </motion.div>
      </div>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: "easeOut", delay: 0.24 }}
        className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2 md:hidden"
      >
        <div className="mx-auto flex w-full max-w-md flex-col items-center gap-2">
          <motion.button
            type="button"
            onClick={props.onStart}
            whileTap={{ scale: 0.98 }}
            className="w-full rounded-xl border border-emerald-300/70 bg-emerald-500/20 px-6 py-2.5 text-sm font-black uppercase tracking-[0.14em] text-emerald-100"
          >
            Empezar Combate
          </motion.button>
          <AcademyBackButton label="Volver a Academy" onClick={props.onBack} className="w-full" />
        </div>
      </motion.div>
    </section>
  );
}
