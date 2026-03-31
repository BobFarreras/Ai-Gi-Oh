// src/components/game/board/ui/GraveyardBrowser.tsx - Overlay reutilizable para navegar cartas del cementerio o zona destruida.
"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { ICard } from "@/core/entities/ICard";
import { Card } from "@/components/game/card/Card";

interface GraveyardBrowserProps {
  isOpen: boolean;
  ownerName: string;
  title?: string;
  emptyMessage?: string;
  cards: ICard[];
  selectableCardRefs?: string[];
  onClose: () => void;
  onSelectCard: (card: ICard) => void;
}

export function GraveyardBrowser({
  isOpen,
  ownerName,
  title = "Cementerio",
  emptyMessage = "No hay cartas en esta zona.",
  cards,
  selectableCardRefs = [],
  onClose,
  onSelectCard,
}: GraveyardBrowserProps) {
  const hasSelectionFilter = selectableCardRefs.length > 0;
  const [selectedCardRef, setSelectedCardRef] = useState<string | null>(null);
  const selectedCard = useMemo(() => {
    if (!selectedCardRef) return null;
    return cards.find((card) => (card.runtimeId ?? card.id) === selectedCardRef) ?? null;
  }, [cards, selectedCardRef]);
  const detailCard = selectedCard ?? cards[0] ?? null;
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          data-tutorial-id="tutorial-board-graveyard-browser"
          className="absolute inset-0 z-[180] bg-black/65 backdrop-blur-sm flex items-center justify-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.2 }}
            className="w-[92%] max-w-5xl max-h-[72vh] bg-zinc-950/95 border border-cyan-500/40 rounded-2xl shadow-[0_0_60px_rgba(6,182,212,0.2)] p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 border-b border-zinc-700/70 pb-3">
              <h3 className="text-lg text-cyan-200 font-black uppercase tracking-wider">{title} de {ownerName}</h3>
              <button data-tutorial-id="tutorial-board-graveyard-close" aria-label="Cerrar zona de cartas" onClick={onClose} className="text-zinc-300 hover:text-white">
                <X size={20} />
              </button>
            </div>
            {cards.length === 0 && <p className="text-zinc-400">{emptyMessage}</p>}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_18rem] gap-4 max-h-[58vh]">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-500/70 [&::-webkit-scrollbar-track]:bg-transparent">
                {cards.map((card, index) => {
                const cardRef = card.runtimeId ?? card.id;
                const isSelectable = !hasSelectionFilter || selectableCardRefs.includes(cardRef);
                const isSelected = detailCard ? (detailCard.runtimeId ?? detailCard.id) === cardRef : false;
                return (
                <button
                  key={`${card.id}-${index}`}
                  aria-label={`Ver ${card.name}`}
                  onClick={() => {
                    setSelectedCardRef(cardRef);
                    if (isSelectable) onSelectCard(card);
                  }}
                  disabled={!isSelectable}
                  className={`text-left rounded-xl border transition-colors p-2 ${
                    isSelectable
                      ? `${isSelected ? "border-cyan-300 bg-zinc-900 shadow-[0_0_20px_rgba(34,211,238,0.25)]" : "border-cyan-400/55 bg-zinc-900/80 hover:border-cyan-300 hover:bg-zinc-900 shadow-[0_0_16px_rgba(34,211,238,0.2)]"}`
                      : "border-zinc-700/60 bg-zinc-900/45 opacity-45 cursor-not-allowed"
                  }`}
                >
                  <div className="h-[160px] flex items-center justify-center overflow-hidden rounded-lg border border-zinc-800/80 bg-black/55">
                    <div className="scale-[0.4] origin-center">
                      <Card card={card} />
                    </div>
                  </div>
                  <p className="text-[11px] font-bold text-white truncate mt-2">{card.name}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-zinc-400 uppercase">{card.type}</p>
                    <p className="text-[10px] text-amber-300 font-bold">C{card.cost}</p>
                  </div>
                </button>
              );
                })}
              </div>
              <div className="hidden lg:flex h-full min-h-[22rem] flex-col rounded-xl border border-cyan-500/35 bg-zinc-900/55 p-3">
                {detailCard ? (
                  <>
                    <div className="h-[13.5rem] overflow-hidden rounded-lg border border-zinc-800/80 bg-black/45 flex items-center justify-center">
                      <div className="scale-[0.5] origin-center"><Card card={detailCard} /></div>
                    </div>
                    <div className="mt-2 min-h-0 flex-1 overflow-y-auto pr-1">
                      <h4 className="text-sm font-black uppercase tracking-wider text-cyan-200">{detailCard.name}</h4>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{detailCard.faction} · {detailCard.type}</p>
                      <p className="mt-2 text-xs leading-relaxed text-zinc-200 whitespace-pre-line">{detailCard.description}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-zinc-400 text-sm">Selecciona una carta para ver su detalle.</p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
