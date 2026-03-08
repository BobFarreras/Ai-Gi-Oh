// src/components/hub/home/HomeDeckPanel.tsx - Panel del deck con slots interactivos y mini-cartas con progreso.
import { motion } from "framer-motion";
import { IDeck } from "@/core/entities/home/IDeck";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";
import { HomeMiniCard } from "@/components/hub/home/HomeMiniCard";
import { HomeFusionDeckPanel } from "@/components/hub/home/HomeFusionDeckPanel";
import { DragEvent } from "react";

interface HomeDeckPanelProps {
  deck: IDeck;
  collection: ICollectionCard[];
  cardProgressById: Map<string, IPlayerCardProgress>;
  selectedSlotIndex: number | null;
  selectedFusionSlotIndex: number | null;
  onSelectSlot: (slotIndex: number) => void;
  onSelectFusionSlot: (slotIndex: number) => void;
  onStartDragDeckSlot: (slotIndex: number, event: DragEvent<HTMLElement>) => void;
  onStartDragFusionSlot: (slotIndex: number, event: DragEvent<HTMLElement>) => void;
  onDropOnDeckSlot: (slotIndex: number, event: DragEvent<HTMLElement>) => void;
  onDropOnFusionSlot: (slotIndex: number, event: DragEvent<HTMLElement>) => void;
  selectedCardId: string | null;
}

export function HomeDeckPanel({
  deck,
  collection,
  cardProgressById,
  selectedSlotIndex,
  selectedFusionSlotIndex,
  onSelectSlot,
  onSelectFusionSlot,
  onStartDragDeckSlot,
  onStartDragFusionSlot,
  onDropOnDeckSlot,
  onDropOnFusionSlot,
  selectedCardId,
}: HomeDeckPanelProps) {
  const cardById = new Map(collection.map((entry) => [entry.card.id, entry.card]));

  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-cyan-800/35 bg-[#030c16]/72 p-3 sm:p-4 shadow-[0_0_22px_rgba(8,145,178,0.12)]">
      <div className="mb-3 flex items-center justify-between border-b border-cyan-900/50 pb-2">
        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-cyan-200">Deck</h2>
        <p className="text-xs font-semibold text-cyan-100/85 bg-black/50 px-2 py-1 rounded border border-cyan-900">
          {deck.slots.filter((slot) => slot.cardId !== null).length}/20
        </p>
      </div>
      
      <div className="home-modern-scroll min-h-0 flex-1 overflow-y-auto p-3">
        {/* REFACTOR CLAVE: auto-fill para que quepan tantas cartas por fila como el ancho permita */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(68px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(76px,1fr))] content-start justify-items-center gap-2 w-full pb-4">
          {deck.slots.map((slot) => {
            const card = slot.cardId ? cardById.get(slot.cardId) : null;
            const isSelected = selectedSlotIndex === slot.index || (slot.cardId !== null && slot.cardId === selectedCardId);
            const progress = slot.cardId ? cardProgressById.get(slot.cardId) : null;
            
            return (
          <motion.div
                key={slot.index}
                whileHover={{ scale: 1.05, y: -2, zIndex: 10 }}
                whileTap={{ scale: 0.95 }}
                className="relative w-[76px] flex justify-center"
              >
                <HomeMiniCard
                  card={card ?? null}
                  isSelected={isSelected}
                  label={`Slot ${slot.index + 1}`}
                  onClick={() => onSelectSlot(slot.index)}
                  isDraggable={card !== null}
                  onDragStart={(event) => onStartDragDeckSlot(slot.index, event)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => onDropOnDeckSlot(slot.index, event)}
                  showSlotContainer={card === null}
                  versionTier={progress?.versionTier ?? 0}
                  level={progress?.level ?? 0}
                  xp={progress?.xp ?? 0}
                  masteryPassiveSkillId={progress?.masteryPassiveSkillId ?? null}
                />
              </motion.div>
            );
          })}
        </div>
        <HomeFusionDeckPanel
          deck={deck}
          collection={collection}
          cardProgressById={cardProgressById}
          selectedFusionSlotIndex={selectedFusionSlotIndex}
          selectedCardId={selectedCardId}
          onSelectFusionSlot={onSelectFusionSlot}
          onStartDragFusionSlot={onStartDragFusionSlot}
          onDropOnFusionSlot={onDropOnFusionSlot}
        />
      </div>
    </section>
  );
}
