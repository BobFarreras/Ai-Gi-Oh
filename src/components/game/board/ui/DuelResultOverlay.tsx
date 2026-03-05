// src/components/game/board/ui/DuelResultOverlay.tsx - Overlay final de duelo con resultado y resumen de experiencia de cartas.
"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { ICard } from "@/core/entities/ICard";
import { IPlayer } from "@/core/entities/IPlayer";
import { getCardLevelProgressMetrics } from "@/core/services/progression/card-level-rules";
import type { IAppliedCardExperienceResult } from "@/core/use-cases/progression/ApplyBattleCardExperienceUseCase";

interface DuelResultOverlayProps {
  winnerPlayerId: string | "DRAW" | null;
  playerA: IPlayer;
  playerB: IPlayer;
  battleExperienceSummary: IAppliedCardExperienceResult[];
  battleExperienceCardLookup: Record<string, ICard>;
  onRestart: () => void;
}

function resolveResultText(winnerPlayerId: string | "DRAW" | null, playerA: IPlayer, playerB: IPlayer): string {
  if (!winnerPlayerId) return "";
  if (winnerPlayerId === "DRAW") return "EMPATE";
  if (winnerPlayerId === playerA.id) return `VICTORIA DE ${playerA.name}`;
  if (winnerPlayerId === playerB.id) return `DERROTA - GANA ${playerB.name}`;
  return "FIN DEL DUELO";
}

function ExperienceCard({ entry, card }: { entry: IAppliedCardExperienceResult; card: ICard | null }) {
  const previousTotalXp = Math.max(0, entry.progress.xp - entry.gainedXp);
  const oldMetrics = getCardLevelProgressMetrics(entry.oldLevel, previousTotalXp);
  const newMetrics = getCardLevelProgressMetrics(entry.newLevel, entry.progress.xp);
  return (
    <motion.article
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="relative overflow-hidden rounded-xl border border-cyan-300/35 bg-cyan-950/35 p-2"
    >
      <div className="relative mb-2 h-24 overflow-hidden rounded-md border border-cyan-500/35 bg-black/70">
        {card?.bgUrl ? <Image src={card.bgUrl} alt="" fill sizes="180px" className="object-cover opacity-70" /> : null}
        {card?.renderUrl ? <Image src={card.renderUrl} alt={card?.name ?? entry.cardId} fill sizes="180px" className="object-contain p-1" /> : null}
        <motion.span
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: [0, 1, 1, 0], y: [10, -2, -18, -28], scale: [0.9, 1, 1, 1.1] }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 text-sm font-black text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]"
        >
          +{entry.gainedXp} EXP
        </motion.span>
      </div>
      <p className="truncate text-sm font-black uppercase tracking-wide text-cyan-50">{card?.name ?? entry.cardId}</p>
      <p className="mb-1 text-[11px] text-cyan-200/80">Lv {entry.oldLevel} → {entry.newLevel}</p>
      <div className="h-2 overflow-hidden rounded-full border border-cyan-300/25 bg-black/55">
        <motion.div
          initial={{ width: `${Math.round(oldMetrics.progressRatio * 100)}%` }}
          animate={{ width: `${Math.round(newMetrics.progressRatio * 100)}%` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-cyan-300 to-emerald-300"
        />
      </div>
    </motion.article>
  );
}

export function DuelResultOverlay({
  winnerPlayerId,
  playerA,
  playerB,
  battleExperienceSummary,
  battleExperienceCardLookup,
  onRestart,
}: DuelResultOverlayProps) {
  const text = resolveResultText(winnerPlayerId, playerA, playerB);
  const isVisible = Boolean(winnerPlayerId);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[170] bg-black/75 backdrop-blur-sm flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.75, opacity: 0, rotateX: -20 }}
            animate={{ scale: 1, opacity: 1, rotateX: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
            className="w-[92%] max-w-3xl rounded-3xl border-2 border-cyan-300/60 bg-gradient-to-br from-cyan-950/90 via-zinc-950/95 to-red-950/90 shadow-[0_0_90px_rgba(34,211,238,0.35)] p-10 text-center"
          >
            <p className="text-sm tracking-[0.4em] uppercase text-cyan-300/90 mb-3">Resultado</p>
            <h2 className="text-5xl font-black uppercase text-white tracking-wide drop-shadow-[0_0_24px_rgba(255,255,255,0.3)] mb-3">
              {text}
            </h2>
            <p className="text-zinc-300 text-sm mb-8">Pulsa para reiniciar el duelo.</p>
            {battleExperienceSummary.length > 0 ? (
              <div className="mb-6 rounded-xl border border-cyan-300/30 bg-cyan-950/30 p-3 text-left">
                <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Experiencia de cartas</p>
                <div className="home-modern-scroll grid max-h-52 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                  {battleExperienceSummary.map((entry) => (
                    <ExperienceCard key={entry.cardId} entry={entry} card={battleExperienceCardLookup[entry.cardId] ?? null} />
                  ))}
                </div>
              </div>
            ) : (
              <p className="mb-6 text-xs uppercase tracking-[0.2em] text-zinc-400">Sin experiencia de cartas en este duelo.</p>
            )}
            <button
              aria-label="Reiniciar duelo"
              onClick={onRestart}
              className="px-6 py-3 rounded-xl border border-cyan-300/60 bg-cyan-500/20 text-cyan-100 font-black uppercase tracking-wider hover:bg-cyan-400/30 transition-colors"
            >
              Nueva partida
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
