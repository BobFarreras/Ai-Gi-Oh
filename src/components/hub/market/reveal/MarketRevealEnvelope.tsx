// src/components/hub/market/reveal/MarketRevealEnvelope.tsx - Renderiza el sobre central y el flash durante fases de apertura.
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { PackageOpen, Sparkles } from "lucide-react";
import { RevealPhase } from "@/components/hub/market/internal/usePackRevealPhase";

interface MarketRevealEnvelopeProps {
  phase: RevealPhase;
}

export function MarketRevealEnvelope({ phase }: MarketRevealEnvelopeProps) {
  return (
    <>
      <AnimatePresence>
        {(phase === "IDLE" || phase === "OPENING") && (
          <motion.div
            key="pack-center"
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={
              phase === "IDLE"
                ? { scale: 1, opacity: 1, y: [-15, 15, -15] }
                : { scale: 1.55, opacity: 0, y: 48, filter: "brightness(300%) blur(10px)" }
            }
            exit={{ opacity: 0 }}
            transition={
              phase === "IDLE"
                ? { y: { duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }, scale: { type: "spring", damping: 20 } }
                : { duration: 0.5, ease: "easeIn" }
            }
            className="relative z-50 flex aspect-[3/4] w-[190px] flex-col justify-between rounded-2xl border-2 border-fuchsia-400 bg-[linear-gradient(145deg,rgba(134,25,143,0.9),rgba(15,23,42,0.95))] p-5 shadow-[0_0_80px_rgba(192,38,211,0.5)] sm:w-[220px] sm:p-6"
          >
            <div className="pointer-events-none absolute inset-0 rounded-xl bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.2),transparent_50%)]" />
            <div className="pointer-events-none absolute inset-0 animate-[shine_2s_infinite] rounded-xl bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)]" />
            <div className="relative z-10 text-center">
              <div className="mb-2 flex items-center justify-center gap-1.5">
                <Sparkles size={16} className="animate-pulse text-fuchsia-300" />
                <p className="text-xs font-black uppercase tracking-[0.3em] text-fuchsia-300">Nexus Pack</p>
              </div>
            </div>
            <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border border-fuchsia-400/50 bg-fuchsia-500/20 shadow-[0_0_40px_rgba(192,38,211,0.6)] backdrop-blur-md">
                <PackageOpen size={40} className="text-fuchsia-100" />
              </div>
              <p className="mt-8 animate-pulse text-[10px] font-black uppercase tracking-[0.3em] text-white">Extrayendo...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === "OPENING" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-none absolute inset-0 z-[60] bg-white mix-blend-overlay"
          />
        )}
      </AnimatePresence>
    </>
  );
}
