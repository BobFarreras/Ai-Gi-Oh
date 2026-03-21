// src/components/hub/home/HomeCollectionPanel.tsx - Panel de almacén con selección de cartas y contador de copias (deck/almacén).
import { motion } from "framer-motion";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IDeck } from "@/core/entities/home/IDeck";
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";
import { HomeMiniCard } from "@/components/hub/home/HomeMiniCard";
import { useVirtualGridWindow } from "@/components/hub/internal/useVirtualGridWindow";
import { DragEvent, useRef } from "react";

interface HomeCollectionPanelProps {
  deck: IDeck;
  collection: ICollectionCard[];
  cardProgressById: Map<string, IPlayerCardProgress>;
  evolvableCardIds: Set<string>;
  selectedCardId: string | null;
  onSelectCard: (cardId: string) => void;
  onStartDragCollectionCard: (cardId: string, event: DragEvent<HTMLElement>) => void;
  onDropOnCollectionArea: (event: DragEvent<HTMLElement>) => void;
}

export function HomeCollectionPanel({
  deck,
  collection,
  cardProgressById,
  evolvableCardIds,
  selectedCardId,
  onSelectCard,
  onStartDragCollectionCard,
  onDropOnCollectionArea,
}: HomeCollectionPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const windowState = useVirtualGridWindow({
    containerRef: scrollRef,
    itemCount: collection.length,
    itemMinWidth: 84,
    itemHeight: 145,
    gap: 12,
    overscanRows: 2,
  });
  const visibleCollection = collection.slice(windowState.startIndex, windowState.endIndex);
  const usedByCardId = new Map<string, number>();
  
  for (const slot of deck.slots) {
    if (!slot.cardId) continue;
    usedByCardId.set(slot.cardId, (usedByCardId.get(slot.cardId) ?? 0) + 1);
  }
  for (const slot of deck.fusionSlots) {
    if (!slot.cardId) continue;
    usedByCardId.set(slot.cardId, (usedByCardId.get(slot.cardId) ?? 0) + 1);
  }

  return (
    <section data-tutorial-id="tutorial-home-collection" className="flex h-full min-h-0 flex-col rounded-2xl border border-cyan-800/35 bg-[#031020]/50 p-3">
      <h2 className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-cyan-200 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
        Almacén
      </h2>
      
      {/* REFACTOR 1: Aseguramos overflow-x-hidden por seguridad y añadimos padding derecho para la scrollbar */}
      <div
        ref={scrollRef}
        className="home-modern-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-2"
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDropOnCollectionArea}
      >
        <div className="relative pb-4" style={{ height: `${windowState.totalHeight}px` }}>
          <div
            className="grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-3 justify-items-center"
            style={{ transform: `translateY(${windowState.offsetTop}px)` }}
          >
          {visibleCollection.map((entry) => {
            const usedCopies = usedByCardId.get(entry.card.id) ?? 0;
            const availableStorageCopies = Math.max(0, entry.ownedCopies - usedCopies);
            const canAdd = usedCopies < Math.min(3, entry.ownedCopies);
            const isSelected = selectedCardId === entry.card.id;
            const canEvolve = evolvableCardIds.has(entry.card.id);
            const progress = cardProgressById.get(entry.card.id);
            const isMasteryTier = (progress?.versionTier ?? 0) >= 5;
            
            return (
              <motion.button
                key={entry.card.id}
                type="button"
                aria-label={`Seleccionar ${entry.card.name}`}
                whileHover={canAdd ? { y: -4, scale: 1.05 } : {}}
                whileTap={canAdd ? { scale: 0.95 } : {}}
                animate={canEvolve ? { rotate: [0, -1.8, 1.8, -1.2, 1.2, 0], y: [0, -1, 0], scale: [1, 1.03, 1] } : {}}
                transition={canEvolve ? { duration: 0.52, repeat: Infinity, repeatDelay: 1.15 } : {}}
                onClick={() => onSelectCard(entry.card.id)}
                // REFACTOR 3: Ajustes de opacidad más drásticos para dar feedback visual claro
                className={`relative flex flex-col items-center w-[84px] transition-opacity ${
                  canAdd ? "cursor-pointer" : "cursor-not-allowed opacity-40 grayscale-[50%]"
                }`}
                style={
                  isMasteryTier
                    ? undefined
                    : {
                        contentVisibility: "auto",
                        containIntrinsicSize: "145px 84px",
                        filter: canEvolve ? "drop-shadow(0 0 9px rgba(34, 211, 238, 0.55))" : undefined,
                      }
                }
              >
                <HomeMiniCard
                  card={entry.card}
                  label={`Carta ${entry.card.name}`}
                  isSelected={isSelected}
                  isDraggable
                  onDragStart={(event) => onStartDragCollectionCard(entry.card.id, event)}
                  showSlotContainer={false}
                  versionTier={progress?.versionTier ?? 0}
                  level={progress?.level ?? 0}
                  xp={progress?.xp ?? 0}
                  masteryPassiveSkillId={progress?.masteryPassiveSkillId ?? null}
                />
                
                {/* Indicador de copias con estilo neón si está al máximo */}
                <span className={`mt-2 rounded bg-black/80 px-2 py-0.5 text-[10px] font-mono font-bold tracking-widest border ${
                  usedCopies >= Math.min(3, entry.ownedCopies)
                    ? "text-red-400 border-red-900/50 shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                    : "text-cyan-300 border-cyan-900/50"
                }`}>
                  D {usedCopies}/{Math.min(3, entry.ownedCopies)} U {availableStorageCopies}
                </span>
              </motion.button>
            );
          })}
          </div>
        </div>
      </div>
    </section>
  );
}
