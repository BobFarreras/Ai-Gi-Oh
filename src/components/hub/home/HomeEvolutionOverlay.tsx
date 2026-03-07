// src/components/hub/home/HomeEvolutionOverlay.tsx - Overlay cinemático para visualizar evolución de versión y fusión de copias.
"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { ICard } from "@/core/entities/ICard";
import { Card } from "@/components/game/card/Card";
import { useHubModuleSfx } from "@/components/hub/internal/use-hub-module-sfx";

interface HomeEvolutionOverlayProps {
  card: ICard | null;
  fromVersionTier: number;
  toVersionTier: number;
  level: number;
  consumedCopies: number;
}

function resolveGlowClass(versionTier: number): string {
  if (versionTier >= 5) return "shadow-[0_0_90px_rgba(245,158,11,0.8)]";
  if (versionTier >= 4) return "shadow-[0_0_80px_rgba(236,72,153,0.75)]";
  if (versionTier >= 3) return "shadow-[0_0_70px_rgba(168,85,247,0.72)]";
  if (versionTier >= 2) return "shadow-[0_0_60px_rgba(56,189,248,0.7)]";
  return "shadow-[0_0_50px_rgba(34,211,238,0.65)]";
}

export function HomeEvolutionOverlay({
  card,
  fromVersionTier,
  toVersionTier,
  level,
  consumedCopies,
}: HomeEvolutionOverlayProps) {
  const { play } = useHubModuleSfx();
  useEffect(() => {
    if (!card) return;
    play("EVOLUTION_OVERLAY");
  }, [card, play]);
  if (!card) return null;
  const visualCopies = Math.max(4, Math.min(consumedCopies, 64));
  return (
    <div className="pointer-events-none absolute inset-0 z-[420] flex items-center justify-center bg-black/75 px-3 py-4 backdrop-blur-md sm:px-6 sm:py-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="relative flex w-full max-w-xl flex-col items-center"
      >
        <motion.div
          initial={{ opacity: 0.4, scale: 0.8 }}
          animate={{ opacity: [0.4, 0.9, 0.3], scale: [0.8, 1.45, 1.05] }}
          transition={{ duration: 1.2, times: [0, 0.55, 1], repeat: 1 }}
          className="absolute h-[280px] w-[280px] rounded-full bg-[radial-gradient(circle,rgba(251,146,60,0.35),rgba(245,158,11,0.22),transparent_70%)] blur-2xl sm:h-[460px] sm:w-[460px]"
        />
        <motion.div
          initial={{ opacity: 0.4, scale: 0.6 }}
          animate={{ opacity: [0.4, 0.85, 0.45], scale: [0.6, 1.35, 1.1] }}
          transition={{ duration: 1.4, times: [0, 0.55, 1], repeat: 1 }}
          className="absolute h-[220px] w-[220px] rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.4),transparent_65%)] blur-2xl sm:h-[380px] sm:w-[380px]"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.2] }}
          transition={{ duration: 1.5, times: [0, 0.4, 1] }}
          className="absolute inset-x-0 top-[40%] h-[120px] bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.35),rgba(220,38,38,0.2),transparent_65%)] blur-xl sm:top-[38%] sm:h-[180px]"
        />
        <div className="mb-3 flex flex-wrap items-center justify-center gap-2 rounded border border-cyan-500/35 bg-[#020c18]/85 px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-cyan-100 sm:mb-4 sm:gap-3 sm:px-4 sm:text-xs sm:tracking-[0.18em]">
          <span>Version</span>
          <span className="text-amber-300">V{fromVersionTier}</span>
          <span className="text-cyan-400">→</span>
          <motion.span
            className="text-amber-200"
            animate={{ scale: [1, 1.25, 1], textShadow: ["0 0 0px rgba(251,191,36,0)", "0 0 12px rgba(251,191,36,0.9)", "0 0 0px rgba(251,191,36,0)"] }}
            transition={{ duration: 0.9, repeat: 1 }}
          >
            V{toVersionTier}
          </motion.span>
        </div>
        <div className="relative mb-3 h-8 w-[82%] max-w-80 sm:mb-5 sm:h-10">
          {Array.from({ length: visualCopies }).map((_, index) => (
            <motion.div
              key={`copy-fusion-${index}`}
              initial={{ opacity: 0, y: 32, scale: 0.45, x: (index - visualCopies / 2) * 10 }}
              animate={{ opacity: [0, 1, 0], y: [32, -10, -44], scale: [0.45, 1, 0.55], x: [((index - visualCopies / 2) * 10), 0, 0] }}
              transition={{ duration: 0.95, delay: index * 0.015 }}
              className="absolute left-1/2 top-1/2 h-3 w-3 rounded-full border border-amber-300/80 bg-gradient-to-b from-amber-200/80 to-orange-500/40 sm:h-3.5 sm:w-3.5"
            />
          ))}
        </div>
        <div className="pointer-events-none absolute left-1/2 top-[44%] h-36 w-52 -translate-x-1/2 sm:top-[43%] sm:h-48 sm:w-72">
          <motion.div
            initial={{ opacity: 0, scaleY: 0.2 }}
            animate={{ opacity: [0, 0.9, 0.2], scaleY: [0.2, 1.1, 0.8] }}
            transition={{ duration: 1.1, repeat: 1 }}
            className="absolute inset-x-1/2 h-full w-1 -translate-x-1/2 rotate-6 bg-cyan-300/70 blur-[1px]"
          />
          <motion.div
            initial={{ opacity: 0, scaleY: 0.2 }}
            animate={{ opacity: [0, 0.85, 0.15], scaleY: [0.2, 1.15, 0.85] }}
            transition={{ duration: 1.1, delay: 0.06, repeat: 1 }}
            className="absolute inset-x-1/2 h-full w-1 -translate-x-1/2 -rotate-6 bg-sky-300/70 blur-[1px]"
          />
        </div>
        <motion.div
          initial={{ scale: 0.72, rotate: -2 }}
          animate={{ scale: [0.72, 1.12, 1], rotate: [-2, 2, 0] }}
          transition={{ duration: 1.2, times: [0, 0.65, 1] }}
          className={`origin-center scale-[0.52] sm:scale-100 ${resolveGlowClass(toVersionTier)}`}
        >
          <Card
            card={card}
            versionTier={toVersionTier}
            level={level}
            disableHoverEffects
            disableDefaultShadow
            clipToFrameShape
          />
        </motion.div>
        <p className="-mt-12 rounded border border-cyan-500/35 bg-black/65 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-100 sm:-mt-10 sm:text-xs">
          Fusión de {consumedCopies} copias completada
        </p>
      </motion.div>
    </div>
  );
}
