// src/components/hub/home/HomeFusionDeckPanel.tsx - Renderiza el bloque de fusión con dos slots y soporte de selección/drag.
import { IDeck } from "@/core/entities/home/IDeck";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";
import { HomeMiniCard } from "@/components/hub/home/HomeMiniCard";
import { DragEvent } from "react";

interface HomeFusionDeckPanelProps {
  deck: IDeck;
  collection: ICollectionCard[];
  cardProgressById: Map<string, IPlayerCardProgress>;
  selectedFusionSlotIndex: number | null;
  selectedCardId: string | null;
  onSelectFusionSlot: (slotIndex: number) => void;
  onStartDragFusionSlot: (slotIndex: number, event: DragEvent<HTMLElement>) => void;
  onDropOnFusionSlot: (slotIndex: number, event: DragEvent<HTMLElement>) => void;
}

export function HomeFusionDeckPanel({
  deck,
  collection,
  cardProgressById,
  selectedFusionSlotIndex,
  selectedCardId,
  onSelectFusionSlot,
  onStartDragFusionSlot,
  onDropOnFusionSlot,
}: HomeFusionDeckPanelProps) {
  const cardById = new Map(collection.map((entry) => [entry.card.id, entry.card]));
  
  return (
    // ESTILO WIREFRAME: bg-transparent, sin blur, solo bordes definidos y un levísimo resplandor interno
    <section data-tutorial-id="tutorial-home-fusion-block" className="mt-3 rounded-2xl border border-cyan-500/40 bg-transparent p-3 shadow-[inset_0_0_20px_rgba(34,211,238,0.05)]">
      
      {/* HEADER */}
      <div className="mb-2 flex items-center justify-between border-b border-cyan-900/60 pb-2">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
          Bloque Fusión
        </h3>
        <p className="text-[11px] font-semibold text-cyan-100/80">
          {deck.fusionSlots.filter((slot) => slot.cardId !== null).length}/2
        </p>
      </div>

      {/* SLOTS */}
      <div className="mx-auto grid w-full max-w-[220px] grid-cols-2 place-items-center gap-3">
        {deck.fusionSlots.map((slot) => {
          const card = slot.cardId ? cardById.get(slot.cardId) ?? null : null;
          const progress = slot.cardId ? cardProgressById.get(slot.cardId) ?? null : null;
          const isSelected = selectedFusionSlotIndex === slot.index || (slot.cardId !== null && selectedCardId === slot.cardId);
          
          return (
            <div key={`fusion-slot-${slot.index}`} data-tutorial-id={card ? `tutorial-home-fusion-card-${card.id}` : undefined} className="w-[76px]">
              <HomeMiniCard
                card={card}
                isSelected={isSelected}
                label={`Fusión ${slot.index + 1}`}
                onClick={() => onSelectFusionSlot(slot.index)}
                isDraggable={card !== null}
                onDragStart={(event) => onStartDragFusionSlot(slot.index, event)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => onDropOnFusionSlot(slot.index, event)}
                showSlotContainer={card === null}
                versionTier={progress?.versionTier ?? 0}
                level={progress?.level ?? 0}
                xp={progress?.xp ?? 0}
                masteryPassiveSkillId={progress?.masteryPassiveSkillId ?? null}
              />
            </div>
          );
        })}
      </div>
      
    </section>
  );
}
