// src/components/hub/market/MarketPackRevealOverlay.tsx - Overlay fullscreen de desencriptación para revelar cartas del sobre.
"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ICard } from "@/core/entities/ICard";
import { Card } from "@/components/game/card/Card";

interface MarketPackRevealOverlayProps {
  cards: ICard[];
  isOpen: boolean;
  onClose: () => void;
}

export function MarketPackRevealOverlay({ cards, isOpen, onClose }: MarketPackRevealOverlayProps) {
  const [revealedCount, setRevealedCount] = useState(1);
  const visibleCards = useMemo(() => cards.slice(0, revealedCount), [cards, revealedCount]);
  const isFinished = revealedCount >= cards.length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[400] bg-[#020915]/94 backdrop-blur-lg"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(34,211,238,0.18),transparent_48%)]" />
          <div className="relative mx-auto flex h-full w-full max-w-7xl flex-col justify-center px-6">
            <p className="mb-4 text-center text-sm font-black uppercase tracking-[0.3em] text-cyan-300">Desencriptando sobre...</p>
            <div className="grid grid-cols-1 place-items-center gap-3 md:grid-cols-3 xl:grid-cols-5">
              {visibleCards.map((card) => (
                <motion.div key={card.id} initial={{ y: 40, opacity: 0, scale: 0.85 }} animate={{ y: 0, opacity: 1, scale: 1 }}>
                  <div className="origin-top scale-[0.62]">
                    <Card card={card} />
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="mt-6 flex justify-center gap-3">
              {!isFinished ? (
                <button
                  type="button"
                  aria-label="Revelar siguiente carta"
                  onClick={() => setRevealedCount((previous) => Math.min(previous + 1, cards.length))}
                  className="border border-cyan-300/45 bg-cyan-400/12 px-4 py-2 text-xs font-black uppercase tracking-widest text-cyan-100 hover:bg-cyan-400/22"
                >
                  Revelar Siguiente
                </button>
              ) : (
                <button
                  type="button"
                  aria-label="Cerrar apertura de sobre"
                  onClick={() => {
                    setRevealedCount(1);
                    onClose();
                  }}
                  className="border border-emerald-300/45 bg-emerald-400/12 px-4 py-2 text-xs font-black uppercase tracking-widest text-emerald-100 hover:bg-emerald-400/22"
                >
                  Finalizar
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
