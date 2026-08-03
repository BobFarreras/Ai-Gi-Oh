// src/components/hub/academy/training/modes/classic/internal/TrainingArenaLobby.tsx - Presenta el lobby de Arena clásica antes del duelo.
"use client";
import { motion } from "framer-motion";
import { Swords } from "lucide-react";
import { GameSelect } from "@/components/ui/GameSelect";
import { TrainingArenaLobbyBackdrop } from "@/components/hub/academy/training/modes/classic/internal/TrainingArenaLobbyBackdrop";
import { TrainingArenaLobbyActions } from "@/components/hub/academy/training/modes/classic/internal/TrainingArenaLobbyActions";
import { TrainingArenaCombatantCard } from "@/components/hub/academy/training/modes/classic/internal/TrainingArenaCombatantCard";
import { TrainingArenaLadder } from "@/components/hub/academy/training/modes/classic/internal/TrainingArenaLadder";
import { ITrainingArenaLobbyProps } from "@/components/hub/academy/training/modes/classic/internal/training-arena-lobby.types";

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
          className="relative rounded-xl border border-cyan-300/55 bg-[#03172a]/90 px-3 py-2.5 shadow-[0_0_22px_rgba(34,211,238,0.24)] md:px-4 lg:px-5"
        >
          {/* Decoraciones (gradiente + barrido) con su propio overflow-hidden, para que el desplegable
              de niveles (popup absoluto) NO quede recortado por la cabecera. */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
            <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(34,211,238,0.08),transparent_50%,rgba(167,139,250,0.08))]" />
            <motion.span
              aria-hidden="true"
              className="absolute inset-y-0 left-[-20%] w-[20%] bg-[linear-gradient(90deg,transparent,rgba(34,211,238,0.24),transparent)]"
              animate={{ x: ["0%", "620%"] }}
              transition={{ duration: 2.6, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            />
          </div>
          <div className="relative flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-black uppercase tracking-[0.14em] text-cyan-100 md:gap-x-3.5 md:text-[12px] lg:text-[13px]">
            {/* "Arena · Nivel X de N" solo en desktop: en móvil sobra (el nivel se ve en el desplegable)
                y libera espacio para que dificultad/Tier/XP/Nexus quepan en una línea. */}
            <span className="hidden text-cyan-300 md:inline md:text-[13px] lg:text-[14px]">Arena · Nivel {props.level} de {props.tierOptions.length}</span>
            <span className="hidden h-1 w-1 rounded-full bg-cyan-300/80 md:block" />
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
          <div className="relative z-30 mt-2 flex flex-col items-center gap-1">
            {/* La etiqueta solo en desktop: en móvil el propio GameSelect ya muestra "NIVEL". */}
            <span className="hidden items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.22em] text-cyan-300/70 md:inline-flex md:text-[10px]">
              Selecciona tu nivel
              {props.isTierSwitching ? (
                <span aria-hidden="true" className="h-2.5 w-2.5 animate-spin rounded-full border-[1.5px] border-cyan-300/40 border-t-cyan-200" />
              ) : null}
            </span>
            {/* Móvil: desplegable con el estilo de juego (como Market/Arsenal). */}
            <div className={`w-44 transition-opacity duration-200 md:hidden ${props.isTierSwitching ? "opacity-60" : "opacity-100"}`}>
              <GameSelect
                label="NIVEL"
                ariaLabel="Seleccionar nivel"
                Icon={Swords}
                value={String(props.level)}
                onChange={(value) => {
                  const tier = Number(value);
                  if (tier !== props.level) props.onSelectTier(tier);
                }}
                options={props.tierOptions.map((tierOption) => ({
                  value: String(tierOption.tier),
                  label: `Nivel ${tierOption.tier}${tierOption.isSelected ? " · actual" : tierOption.isUnlocked ? "" : " · bloqueado"}`,
                  disabled: !tierOption.isUnlocked,
                }))}
              />
            </div>

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

          <TrainingArenaLadder entries={props.ladder} wins={props.ladderWins} />
        </motion.header>
        <div className="grid min-h-0 flex-1 grid-cols-1 items-stretch gap-2 md:w-full md:flex-none md:grid-cols-[1fr_auto_1fr] md:gap-4">
          <TrainingArenaCombatantCard alignment="player" name="Jugador" imageUrl={props.playerAvatarUrl} />
          <div className="mx-auto order-2 flex flex-col items-center justify-center gap-1 self-center px-0.5 text-center md:order-none md:px-2">
            <motion.p
              className="text-3xl font-black uppercase tracking-[0.12em] text-cyan-100 md:text-5xl"
              animate={{ scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] }}
              transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            >
              VS
            </motion.p>
          </div>
          <TrainingArenaCombatantCard alignment="opponent" name={props.opponentName} imageUrl={props.opponentAvatarUrl} />
        </div>
        <TrainingArenaLobbyActions onStart={props.onStart} onBack={props.onBack} />
      </div>
    </section>
  );
}
