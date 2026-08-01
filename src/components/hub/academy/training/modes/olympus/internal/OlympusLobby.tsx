// src/components/hub/academy/training/modes/olympus/internal/OlympusLobby.tsx - Antesala del duelo legendario, con las reglas visibles hasta el último momento.
"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { TrainingArenaLobbyActions } from "../../classic/internal/TrainingArenaLobbyActions";
import { IOlympusBattleRuntime } from "../olympus-api-client";

interface IOlympusLobbyProps {
  runtime: IOlympusBattleRuntime;
  error: string | null;
  onStart: () => void;
  onBack: () => void;
}

/** Reutiliza las acciones del lobby clásico y viste el resto con la identidad oro/violeta del modo. */
export function OlympusLobby({ runtime, error, onStart, onBack }: IOlympusLobbyProps) {
  const { presentation, legend, battle } = runtime;
  return (
    <section className="relative mx-auto flex min-h-dvh w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_-10%,rgba(168,85,247,0.25),transparent_55%),#0a0513] px-3 py-4 text-amber-100 md:px-6">
      <div className="relative z-10 flex h-[calc(100dvh-2rem)] w-full max-w-6xl flex-col gap-4 pb-24 md:h-auto md:pb-0">
        <motion.header
          initial={{ y: -22, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.42, ease: "easeOut" }}
          className="overflow-hidden rounded-xl border border-amber-300/50 bg-[#150c22]/92 shadow-[0_0_28px_rgba(168,85,247,0.28)]"
        >
          <div className="border-b border-amber-300/20 bg-[linear-gradient(100deg,rgba(251,191,36,0.16),transparent,rgba(168,85,247,0.16))] px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.34em] text-violet-300">Desafío legendario</p>
            <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
              <h1 className="text-2xl font-black uppercase italic tracking-[0.08em] text-white md:text-4xl">{legend.displayName}</h1>
              <span className="rounded-md border border-violet-300/35 bg-violet-950/55 px-3 py-1 text-xs font-black uppercase tracking-widest">
                {runtime.resumed ? "Combate retomado" : `Intento ${battle.attemptNumber}`}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-y divide-amber-300/15 md:grid-cols-4 md:divide-y-0">
            <LobbyStat label="Tu campeón" value={presentation.championName} />
            <LobbyStat label="LP de la leyenda" value={legend.startingLp.toLocaleString("es-ES")} />
            <LobbyStat label="Dificultad" value={legend.aiProfile} />
            <LobbyStat label="Si ganas" value={`${legend.baseFragmentReward} de Éter`} />
          </div>
        </motion.header>

        <div className="grid min-h-0 flex-1 grid-cols-1 items-stretch gap-2 md:flex-none md:grid-cols-[1fr_auto_1fr] md:gap-4">
          <LobbyPortrait alignment="player" name={presentation.championName} imageUrl={presentation.championAvatarUrl} />
          <motion.div
            className="order-2 mx-auto flex items-center justify-center text-3xl font-black italic tracking-[0.12em] text-amber-300 md:order-none md:text-5xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            VS
          </motion.div>
          <LobbyPortrait alignment="legend" name={legend.displayName} imageUrl={presentation.legendIntroUrl ?? presentation.legendAvatarUrl} />
        </div>

        {presentation.specialRules.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {presentation.specialRules.map((rule) => (
              <li key={rule} className="rounded-full border border-violet-500/40 bg-violet-950/40 px-3 py-1 text-[10.5px] font-bold text-violet-200">
                ◆ {rule}
              </li>
            ))}
          </ul>
        ) : null}

        {error ? (
          <p role="alert" className="rounded-xl border border-rose-500/50 bg-rose-950/40 px-4 py-2 text-[12px] font-bold text-rose-200">{error}</p>
        ) : null}

        <TrainingArenaLobbyActions
          onStart={onStart}
          onBack={onBack}
          startLabel={runtime.resumed ? "Retomar Combate" : "Empezar Combate"}
        />
      </div>
    </section>
  );
}

function LobbyStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-2.5">
      <p className="text-[9.5px] font-black uppercase tracking-[0.2em] text-violet-400/70">{label}</p>
      <p className="mt-0.5 truncate text-sm font-black text-amber-100">{value}</p>
    </div>
  );
}

function LobbyPortrait({ alignment, name, imageUrl }: { alignment: "player" | "legend"; name: string; imageUrl: string | null }) {
  const isPlayer = alignment === "player";
  return (
    <motion.article
      initial={{ x: isPlayer ? -34 : 34, y: 20, opacity: 0 }}
      animate={{ x: 0, y: 0, opacity: 1 }}
      transition={{ duration: 0.46, ease: "easeOut", delay: isPlayer ? 0.08 : 0.14 }}
      // Clases completas, no interpoladas: Tailwind no ve los nombres construidos en tiempo de ejecución.
      className={`relative min-h-[132px] overflow-hidden rounded-xl border ${
        isPlayer ? "order-1 border-cyan-300/45 bg-[#05192d]/90" : "order-3 border-amber-300/50 bg-[#1a0f26]/90"
      }`}
    >
      {imageUrl ? (
        <Image src={imageUrl} alt="" fill sizes="(max-width: 768px) 100vw, 420px" unoptimized className="object-cover object-top opacity-60" />
      ) : null}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,rgba(10,5,19,0.95))]" />
      <div className="absolute inset-x-3 bottom-2">
        <p className={`text-[9.5px] font-black uppercase tracking-[0.24em] ${isPlayer ? "text-cyan-300" : "text-amber-300"}`}>
          {isPlayer ? "Tu campeón" : "Leyenda"}
        </p>
        <p className="truncate text-lg font-black uppercase italic tracking-tight text-white">{name}</p>
      </div>
    </motion.article>
  );
}
