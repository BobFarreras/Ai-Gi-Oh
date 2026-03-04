// src/components/hub/home/HomeDeckPanel.tsx - Renderiza los 20 slots del deck con selección y extracción rápida.
import { motion } from "framer-motion";
import { IDeck } from "@/core/entities/home/IDeck";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { HomeMiniCard } from "@/components/hub/home/HomeMiniCard";

interface HomeDeckPanelProps {
  deck: IDeck;
  collection: ICollectionCard[];
  selectedSlotIndex: number | null;
  onSelectSlot: (slotIndex: number) => void;
  selectedCardId: string | null;
}

export function HomeDeckPanel({
  deck,
  collection,
  selectedSlotIndex,
  onSelectSlot,
  selectedCardId,
}: HomeDeckPanelProps) {
  const cardById = new Map(collection.map((entry) => [entry.card.id, entry.card]));

  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-cyan-800/35 bg-[#030c16]/72 p-4 shadow-[0_0_22px_rgba(8,145,178,0.12)]">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-cyan-200">Deck</h2>
        <p className="text-xs font-semibold text-cyan-100/85">{deck.slots.filter((slot) => slot.cardId !== null).length}/20</p>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-5 grid-rows-4 content-start justify-items-center gap-x-2 gap-y-2 px-1 py-1">
        {deck.slots.map((slot) => {
          const card = slot.cardId ? cardById.get(slot.cardId) : null;
          const isSelected = selectedSlotIndex === slot.index || (slot.cardId !== null && slot.cardId === selectedCardId);
          return (
            <motion.div
              key={slot.index}
              whileHover={{ scale: 1.03 }}
              className="relative"
            >
              <HomeMiniCard
                card={card ?? null}
                isSelected={isSelected}
                label={`Slot ${slot.index + 1}`}
                onClick={() => onSelectSlot(slot.index)}
              />
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
