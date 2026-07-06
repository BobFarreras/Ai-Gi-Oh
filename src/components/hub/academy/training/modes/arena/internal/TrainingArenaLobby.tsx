// src/components/hub/academy/training/modes/arena/internal/TrainingArenaLobby.tsx - Pantalla previa de arena con presentación Jugador vs Oponente y CTA de inicio.
"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { AcademyBackButton } from "@/components/hub/academy/AcademyBackButton";
import { TrainingArenaLobbyBackdrop } from "@/components/hub/academy/training/modes/arena/internal/TrainingArenaLobbyBackdrop";
import { TrainingArenaLobbyActions } from "@/components/hub/academy/training/modes/arena/internal/TrainingArenaLobbyActions";
import { ITrainingArenaLobbyProps } from "@/components/hub/academy/training/modes/arena/internal/training-arena-lobby.types";

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
            <span className="text-cyan-300 md:text-[13px] lg:text-[14px]">Arena · Nivel {props.level} de {props.tierOptions.length}</span>
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
          <div className="relative mt-1 hidden text-center text-[11px] font-semibold tracking-[0.08em] text-cyan-100/85 md:block md:text-[12px] lg:text-[13px]">
            {props.nextTierRequirementLabel}
          </div>
          <div className="relative mt-2 flex flex-col items-center gap-1">
            <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.22em] text-cyan-300/70 md:text-[10px]">
              Selecciona tu nivel
              {props.isTierSwitching ? (
                <span aria-hidden="true" className="h-2.5 w-2.5 animate-spin rounded-full border-[1.5px] border-cyan-300/40 border-t-cyan-200" />
              ) : null}
            </span>
            {/* Móvil: desplegable compacto (ahorra alto en la cabecera). */}
            <select
              value={props.level}
              disabled={props.isTierSwitching}
              aria-label="Seleccionar nivel"
              onChange={(event) => {
                const tier = Number(event.target.value);
                if (tier !== props.level) props.onSelectTier(tier);
              }}
              className="w-44 rounded-md border border-cyan-300/45 bg-[#03172a] px-3 py-1.5 text-center text-[12px] font-black uppercase tracking-[0.08em] text-cyan-100 outline-none md:hidden"
            >
              {props.tierOptions.map((tierOption) => (
                <option key={tierOption.tier} value={tierOption.tier} disabled={!tierOption.isUnlocked}>
                  Nivel {tierOption.tier}
                  {tierOption.isSelected ? " · actual" : ""}
                  {!tierOption.isUnlocked ? " 🔒" : ""}
                </option>
              ))}
            </select>

            {/* Desktop/tablet: fila de botones. */}
            <div className={`hidden flex-wrap items-center justify-center gap-1.5 transition-opacity duration-200 md:flex ${props.isTierSwitching ? "opacity-60" : "opacity-100"}`}>
              {props.tierOptions.map((tierOption) => {
                const isLocked = !tierOption.isUnlocked;
                return (
                  <button
                    key={tierOption.tier}
                    type="button"
                    disabled={isLocked || tierOption.isSelected || props.isTierSwitching}
                    aria-label={`Seleccionar nivel ${tierOption.tier}`}
                    aria-current={tierOption.isSelected ? "true" : undefined}
                    onClick={() => props.onSelectTier(tierOption.tier)}
                    className={`relative inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.1em] transition md:text-[12px] ${
                      tierOption.isSelected
                        ? "border-emerald-300 bg-emerald-500/25 text-emerald-50 shadow-[0_0_12px_rgba(16,185,129,0.45)] ring-1 ring-emerald-300/60"
                        : isLocked
                          ? "cursor-not-allowed border-slate-600/45 bg-slate-900/45 text-slate-500"
                          : "border-cyan-300/45 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20"
                    }`}
                  >
                    {isLocked ? (
                      <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M6 8V6a4 4 0 1 1 8 0v2h1v9H5V8h1Zm2 0h4V6a2 2 0 1 0-4 0v2Z" /></svg>
                    ) : null}
                    <span>Nivel {tierOption.tier}</span>
                    {tierOption.isSelected ? (
                      <span className="ml-0.5 rounded bg-emerald-300/90 px-1 text-[8px] font-black tracking-[0.05em] text-emerald-950">ACTUAL</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {props.ladder.length > 0 ? (
            <div className="relative mt-2.5 flex flex-col items-center gap-1 border-t border-cyan-300/15 pt-2">
              <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-cyan-300/70 md:text-[10px]">
                Combate {Math.min(props.ladderWins + 1, props.ladder.length)} de {props.ladder.length}
              </span>
              <div className="flex items-center justify-center gap-1.5 md:gap-2.5">
                {props.ladder.map((entry, index) => {
                  const isBeaten = index < props.ladderWins;
                  const isNext = index === props.ladderWins;
                  return (
                    <div
                      key={`${entry.displayName}-${index}`}
                      title={entry.displayName}
                      className={`relative h-7 w-7 shrink-0 overflow-hidden rounded-full border-2 transition md:h-11 md:w-11 ${
                        isBeaten
                          ? "border-emerald-400/80 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                          : isNext
                            ? "border-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.65)] ring-2 ring-cyan-300/50"
                            : "border-slate-600/50 opacity-45 grayscale"
                      }`}
                    >
                      <Image src={entry.avatarUrl} alt={entry.displayName} fill sizes="44px" className="object-cover object-top" />
                      {isBeaten ? (
                        <span className="absolute inset-0 flex items-center justify-center bg-emerald-500/35">
                          <svg className="h-4 w-4 text-white md:h-5 md:w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path d="M8 13.2 4.6 9.8l-1.2 1.2L8 15.6l9-9-1.2-1.2z" />
                          </svg>
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
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
        <TrainingArenaLobbyActions onStart={props.onStart} onBack={props.onBack} />
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
