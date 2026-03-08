// src/components/game/board/ui/DuelResultOverlay.tsx - Overlay final del duelo con resultado, recompensas y progreso de cartas en desktop y mobile.
"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Card } from "@/components/game/card/Card";
import { ICard } from "@/core/entities/ICard";
import { IPlayer } from "@/core/entities/IPlayer";
import type { IAppliedCardExperienceResult } from "@/core/use-cases/progression/ApplyBattleCardExperienceUseCase";
import { DuelResultExperienceCard } from "./internal/DuelResultExperienceCard";
import { DuelResultRewardsPanel } from "./internal/DuelResultRewardsPanel";
import { DuelResultFireworks } from "./internal/DuelResultFireworks";
import { IDuelResultRewardSummary } from "./internal/duel-result-reward-summary";
import { useDuelResultOverlayState } from "./internal/use-duel-result-overlay-state";

interface DuelResultOverlayProps {
  winnerPlayerId: string | "DRAW" | null;
  playerA: IPlayer;
  playerB: IPlayer;
  battleExperienceSummary: IAppliedCardExperienceResult[];
  battleExperienceCardLookup: Record<string, ICard>;
  isBattleExperiencePending: boolean;
  rewardSummary?: IDuelResultRewardSummary | null;
  resultActionLabel?: string;
  onResultAction?: () => void;
  onRestart: () => void;
}

function resolveResultText(winnerPlayerId: string | "DRAW" | null, playerA: IPlayer, playerB: IPlayer): string {
  if (!winnerPlayerId) return "";
  if (winnerPlayerId === "DRAW") return "EMPATE";
  if (winnerPlayerId === playerA.id) return `VICTORIA DE ${playerA.name}`;
  if (winnerPlayerId === playerB.id) return `DERROTA - GANA ${playerB.name}`;
  return "FIN DEL DUELO";
}

export function DuelResultOverlay({
  winnerPlayerId,
  playerA,
  playerB,
  battleExperienceSummary,
  battleExperienceCardLookup,
  isBattleExperiencePending,
  rewardSummary,
  resultActionLabel,
  onResultAction,
  onRestart,
}: DuelResultOverlayProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [mobileTab, setMobileTab] = useState<"CARDS" | "GIFT">("CARDS");
  useEffect(() => {
    const sync = () => setIsMobile(window.innerWidth <= 1024);
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);
  const text = resolveResultText(winnerPlayerId, playerA, playerB);
  const isVisible = Boolean(winnerPlayerId);
  const { actionLabel, handleAction, isGiftOpen, setIsGiftOpen, cardDensity, showFireworks, rewardCard } = useDuelResultOverlayState({
    winnerPlayerId,
    playerA,
    battleExperienceCount: battleExperienceSummary.length,
    rewardSummary,
    resultActionLabel,
    onResultAction,
    onRestart,
  });

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[170] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            className="relative flex h-full max-h-[900px] w-full max-w-[1440px] flex-col rounded-2xl border border-cyan-500/50 bg-zinc-950/90 p-6 sm:p-8 shadow-[0_0_100px_rgba(6,182,212,0.2)] overflow-hidden"
          >
            {/* Efecto de rejilla de fondo */}
            <div className="absolute inset-0 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none" />
            
            <DuelResultFireworks isVisible={showFireworks} />
            
            {/* HEADER COMPACTO: Una sola línea */}
            <div className="relative z-10 mb-6 flex flex-row items-center justify-center gap-4 border-b border-cyan-900/50 pb-4">
              <h2 className="max-w-full text-lg sm:text-3xl font-black uppercase tracking-[0.18em] sm:tracking-widest text-white drop-shadow-[0_0_15px_rgba(34,211,238,0.5)] break-words text-center leading-tight">
                {text}
              </h2>
            </div>

            {/* Layout Principal */}
            <div className="relative z-10 flex-1 flex flex-col lg:flex-row gap-6 min-h-0 w-full">
              {isMobile ? (
                <>
                  {rewardSummary && (
                    <div className="grid grid-cols-3 gap-2 rounded-lg border border-cyan-900/40 bg-black/30 p-2 text-center">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-cyan-400">EXP</p>
                        <p className="text-sm font-black text-white">+{rewardSummary.rewardPlayerExperience}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Nexus</p>
                        <p className="text-sm font-black text-white">+{rewardSummary.rewardNexus}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-amber-400">Regalo</p>
                        <p className="text-sm font-black text-white">{rewardSummary.rewardCards.length}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      aria-label="Ver cartas con experiencia"
                      onClick={() => setMobileTab("CARDS")}
                      className={`flex-1 rounded border px-3 py-2 text-[10px] font-black uppercase tracking-wider ${mobileTab === "CARDS" ? "border-cyan-300/70 bg-cyan-500/15 text-cyan-100" : "border-zinc-700 bg-zinc-900/60 text-zinc-400"}`}
                    >
                      Cartas
                    </button>
                    <button
                      aria-label="Ver carta regalo"
                      onClick={() => setMobileTab("GIFT")}
                      className={`flex-1 rounded border px-3 py-2 text-[10px] font-black uppercase tracking-wider ${mobileTab === "GIFT" ? "border-amber-300/70 bg-amber-500/15 text-amber-100" : "border-zinc-700 bg-zinc-900/60 text-zinc-400"}`}
                    >
                      Regalo
                    </button>
                  </div>
                  <div className="flex-1 min-h-0 p-1 overflow-hidden">
                    {mobileTab === "CARDS" ? (
                      isBattleExperiencePending ? (
                        <div className="flex h-full items-center justify-center">
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="h-10 w-10 rounded-full border-4 border-cyan-900 border-t-cyan-400" />
                        </div>
                      ) : battleExperienceSummary.length > 0 ? (
                        <div className="h-full overflow-y-auto custom-scrollbar pr-1">
                          <div className="grid grid-cols-3 justify-items-center gap-1 pb-2">
                            {battleExperienceSummary.map((entry, index) => {
                              const card = battleExperienceCardLookup[entry.cardId];
                              if (!card) return null;
                              return (
                                <div key={`${entry.cardId}-${index}`} className="min-w-0">
                                  <DuelResultExperienceCard entry={entry} card={card} density="compact" />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <p className="text-xs uppercase tracking-widest text-zinc-500">Sin datos de experiencia.</p>
                        </div>
                      )
                    ) : rewardCard ? (
                      <div className="flex h-full items-center justify-center">
                        <div className="origin-top scale-[0.65]">
                          <Card card={rewardCard} />
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <p className="text-xs uppercase tracking-widest text-zinc-500">No hay carta regalo.</p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleAction}
                    className="group relative w-full py-3 bg-cyan-950/80 border border-cyan-400/60 text-cyan-50 font-black uppercase tracking-[0.2em] text-xs rounded-xl hover:bg-cyan-900 transition-all overflow-hidden shadow-[0_0_15px_rgba(34,211,238,0.15)] hover:shadow-[0_0_25px_rgba(34,211,238,0.4)]"
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[bg-pan_3s_linear_infinite]" />
                    <span className="relative z-10">{actionLabel}</span>
                  </button>
                </>
              ) : (
              <>
              {/* PANEL IZQUIERDO: Recompensas y Botón de Acción */}
              <div className="w-full lg:w-[280px] flex-shrink-0 flex flex-col gap-4">
                {rewardSummary && (
                  <DuelResultRewardsPanel rewardSummary={rewardSummary} isGiftOpen={isGiftOpen} onToggleGift={() => setIsGiftOpen((prev) => !prev)} />
                )}
                
                {/* BOTÓN DE ACCIÓN REUBICADO AQUÍ */}
                <button
                  onClick={handleAction}
                  className="group relative w-full mt-auto py-4 bg-cyan-950/80 border border-cyan-400/60 text-cyan-50 font-black uppercase tracking-[0.2em] text-sm rounded-xl hover:bg-cyan-900 transition-all overflow-hidden shadow-[0_0_15px_rgba(34,211,238,0.15)] hover:shadow-[0_0_25px_rgba(34,211,238,0.4)]"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[bg-pan_3s_linear_infinite]" />
                  <span className="relative z-10">{actionLabel}</span>
                </button>
              </div>

              {/* PANEL DERECHO: Experiencia de Cartas */}
              <div className="flex-1 flex flex-col min-h-0 rounded-xl border border-cyan-900/50 bg-black/40 p-4 sm:p-6 shadow-inner relative overflow-hidden">
                <p className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-cyan-400">
                  Rendimiento del Escuadrón
                </p>
                
                {isBattleExperiencePending ? (
                  <div className="flex flex-1 items-center justify-center">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="h-12 w-12 rounded-full border-4 border-cyan-900 border-t-cyan-400" />
                  </div>
                ) : battleExperienceSummary.length > 0 ? (
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 -mr-2">
                    <div className="flex flex-wrap justify-center sm:justify-start content-start gap-4 pb-4">
                      {battleExperienceSummary.map((entry, index) => {
                        const card = battleExperienceCardLookup[entry.cardId];
                        if (!card) return null;
                        return <DuelResultExperienceCard key={`${entry.cardId}-${index}`} entry={entry} card={card} density={cardDensity} />;
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-1 items-center justify-center">
                    <p className="text-sm uppercase tracking-widest text-zinc-500">Sin datos de experiencia.</p>
                  </div>
                )}
              </div>
              </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
