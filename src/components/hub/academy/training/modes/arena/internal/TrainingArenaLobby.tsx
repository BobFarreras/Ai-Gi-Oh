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
    <section className="relative mx-auto flex min-h-screen w-full items-center justify-center overflow-hidden px-4 py-8 text-cyan-100">
      <TrainingArenaLobbyBackdrop />
      <p className="absolute left-1/2 top-5 z-20 -translate-x-1/2 rounded-full border border-cyan-300/45 bg-cyan-400/10 px-4 py-1 text-xs font-black uppercase tracking-[0.16em]">
        Arena - Nivel {props.level} ({props.tierCode})
      </p>
      <div className="relative z-10 flex w-full max-w-6xl flex-col items-center gap-5">
        <div className="w-full rounded-2xl border border-cyan-300/30 bg-[#031422]/85 p-4 shadow-[0_0_36px_rgba(34,211,238,0.18)]">
          <div className="grid w-full gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-cyan-200 sm:grid-cols-2 md:grid-cols-4">
            <p>Dificultad: {props.tierDifficultyLabel}</p>
            <p>XP victoria: +{props.tierRewardPreview.playerExperience}</p>
            <p>Nexus victoria: +{props.tierRewardPreview.nexus}</p>
            <p>{props.nextTierRequirementLabel}</p>
          </div>
        </div>
        <div className="grid w-full items-center gap-4 md:grid-cols-[1fr_auto_1fr] md:gap-8">
          <article className="rounded-2xl border border-cyan-300/40 bg-[#041a2e]/90 p-4 shadow-[0_0_24px_rgba(34,211,238,0.25)]">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Jugador</p>
            <div className="mt-3 aspect-[4/5] w-full overflow-hidden rounded-xl border border-cyan-200/30">
              <Image src={props.playerAvatarUrl} alt="Avatar del jugador" width={540} height={720} className="h-full w-full object-cover object-center" priority />
            </div>
          </article>
          <div className="mx-auto text-center">
            <motion.p
              className="text-5xl font-black uppercase tracking-[0.15em] text-cyan-100 md:text-6xl"
              animate={{ scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] }}
              transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            >
              VS
            </motion.p>
          </div>
          <article className="rounded-2xl border border-rose-300/40 bg-[#220913]/90 p-4 shadow-[0_0_24px_rgba(251,113,133,0.25)]">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-200">{props.opponentName}</p>
            <div className="mt-3 aspect-[4/5] w-full overflow-hidden rounded-xl border border-rose-200/35">
              <Image src={props.opponentAvatarUrl} alt={`Avatar de ${props.opponentName}`} width={540} height={720} className="h-full w-full object-cover object-center" priority />
            </div>
          </article>
        </div>
        <motion.button
          type="button"
          onClick={props.onStart}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          animate={{ boxShadow: ["0 0 0 rgba(16,185,129,0.0)", "0 0 20px rgba(16,185,129,0.35)", "0 0 0 rgba(16,185,129,0.0)"] }}
          transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          className="rounded-xl border border-emerald-300/70 bg-emerald-500/20 px-7 py-3 text-sm font-black uppercase tracking-[0.15em] text-emerald-100 hover:bg-emerald-400/30"
        >
          Empezar Combate
        </motion.button>
        <AcademyBackButton label="Volver a Academy" onClick={props.onBack} className="mt-1" />
      </div>
    </section>
  );
}
