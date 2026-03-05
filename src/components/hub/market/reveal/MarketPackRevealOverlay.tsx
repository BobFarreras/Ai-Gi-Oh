// src/components/hub/market/reveal/MarketPackRevealOverlay.tsx - Overlay de apertura de sobres con fases de sobre y revelado de cartas.
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MarketRevealCardsGrid } from "@/components/hub/market/reveal/MarketRevealCardsGrid";
import { MarketRevealEnvelope } from "@/components/hub/market/reveal/MarketRevealEnvelope";
import { usePackRevealPhase } from "@/components/hub/market/internal/usePackRevealPhase";
import { ICard } from "@/core/entities/ICard";

interface MarketPackRevealOverlayProps {
  cards: ICard[];
  isOpen: boolean;
  onClose: () => void;
}

export function MarketPackRevealOverlay({ cards, isOpen, onClose }: MarketPackRevealOverlayProps) {
  const { phase, resetPhase } = usePackRevealPhase({ isOpen });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[400] flex items-center justify-center bg-[#01050a]/95 backdrop-blur-2xl"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(192,38,211,0.15),transparent_70%)]" />
          <MarketRevealEnvelope phase={phase} />
          <AnimatePresence>{phase === "REVEALED" && <MarketRevealCardsGrid cards={cards} onClose={() => { onClose(); resetPhase(); }} />}</AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
