// src/components/hub/market/reveal/MarketRevealCardsGrid.tsx - Renderiza las cartas reveladas del sobre con animación escalonada.
"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/game/card/Card";
import { ICard } from "@/core/entities/ICard";

interface MarketRevealCardsGridProps {
  cards: ICard[];
  onClose: () => void;
}

export function MarketRevealCardsGrid({ cards, onClose }: MarketRevealCardsGridProps) {
  return (
    <motion.div
      key="cards-grid"
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.35 } } }}
      className="relative z-50 flex h-full w-full max-w-7xl flex-col items-center justify-center px-3 py-4 sm:px-4 sm:py-6"
    >
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-4 text-center text-lg font-black uppercase tracking-[0.28em] text-cyan-300 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)] sm:mb-6 sm:text-3xl"
      >
        Datos Desencriptados
      </motion.h2>

      <div className="grid w-full max-w-4xl grid-cols-3 place-items-center gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-6 lg:gap-8">
        {cards.map((card, index) => (
          <motion.div
            key={`${card.id}-${index}`}
            variants={{
              hidden: { opacity: 0, rotateY: 90, scale: 0.5, y: 50 },
              visible: { opacity: 1, rotateY: 0, scale: 1, y: 0, transition: { type: "spring", stiffness: 150, damping: 15 } },
            }}
            whileHover={{ scale: 1.05, y: -10 }}
            className="transform-style-3d relative cursor-pointer"
          >
            <div className="relative h-[124px] w-[96px] drop-shadow-[0_16px_28px_rgba(0,0,0,0.75)] sm:h-[220px] sm:w-[170px] xl:h-[260px] xl:w-[200px]">
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="origin-center scale-[0.34] sm:scale-[0.60] xl:scale-[0.75]">
                  <Card card={card} />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: cards.length * 0.35 + 0.8 }} className="mt-4 sm:mt-8">
        <button
          type="button"
          onClick={onClose}
          className="group relative flex items-center gap-2 overflow-hidden rounded-xl border border-cyan-400/60 bg-cyan-950/40 px-10 py-3 text-sm font-black uppercase tracking-[0.2em] text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all hover:border-cyan-300 hover:bg-cyan-900/60 hover:text-white hover:shadow-[0_0_40px_rgba(34,211,238,0.5)] sm:text-base"
        >
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent group-hover:animate-[shine_1s_infinite]" />
          <span className="relative z-10">Integrar al Almacén</span>
        </button>
      </motion.div>
    </motion.div>
  );
}
