// src/components/admin/internal/AdminStarterDeckDeckPanel.tsx - Panel central con slots starter deck y soporte de drop para edición admin.
"use client";

import { DragEvent } from "react";
import { ICard } from "@/core/entities/ICard";
import { HomeMiniCard } from "@/components/hub/home/HomeMiniCard";

interface IAdminStarterDeckDeckPanelProps {
  draftCardIds: Array<string | null>;
  cardById: Map<string, ICard>;
  selectedSlotIndex: number | null;
  isEditMode: boolean;
  onSelectSlot: (slotIndex: number) => void;
  onDropOnSlot: (slotIndex: number, event: DragEvent<HTMLElement>) => void;
  onStartDragSlot: (slotIndex: number, event: DragEvent<HTMLElement>) => void;
}

export function AdminStarterDeckDeckPanel({
  draftCardIds,
  cardById,
  selectedSlotIndex,
  isEditMode,
  onSelectSlot,
  onDropOnSlot,
  onStartDragSlot,
}: IAdminStarterDeckDeckPanelProps) {
  const filledSlots = draftCardIds.filter((cardId) => cardId !== null).length;

  return (
    <section className="flex h-full min-h-0 w-full max-w-[470px] flex-col rounded-2xl border border-cyan-800/35 bg-[#030c16]/72 p-4 shadow-[0_0_22px_rgba(8,145,178,0.12)]">
      <div className="mb-3 flex items-center justify-between border-b border-cyan-900/50 pb-2">
        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-cyan-200">Starter Deck</h2>
        <p className="rounded border border-cyan-900 bg-black/50 px-2 py-1 text-xs font-semibold text-cyan-100/85">
          {filledSlots}/20
        </p>
      </div>
      <div className="home-modern-scroll min-h-0 flex-1 overflow-y-auto p-2">
        <div className="grid w-full grid-cols-5 content-start justify-items-center gap-2 pb-4">
          {draftCardIds.map((cardId, slotIndex) => (
            <div key={slotIndex} className="relative flex w-[76px] justify-center">
              <HomeMiniCard
                card={cardId ? cardById.get(cardId) ?? null : null}
                label={`Slot ${slotIndex + 1}`}
                isSelected={selectedSlotIndex === slotIndex}
                onClick={() => onSelectSlot(slotIndex)}
                isDraggable={isEditMode && cardId !== null}
                onDragStart={(event) => onStartDragSlot(slotIndex, event)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => onDropOnSlot(slotIndex, event)}
                showSlotContainer
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
