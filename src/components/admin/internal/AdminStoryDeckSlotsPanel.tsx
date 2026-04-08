// src/components/admin/internal/AdminStoryDeckSlotsPanel.tsx - Grid editable de slots Story Deck con soporte drag and drop en modo admin.
"use client";

import { DragEvent } from "react";
import { ICard } from "@/core/entities/ICard";
import { HomeMiniCard } from "@/components/hub/home/HomeMiniCard";
import { readAdminStarterDeckDragData, writeAdminStarterDeckDragData } from "@/components/admin/internal/admin-starter-deck-dnd";

interface IAdminStoryDeckSlotsPanelProps {
  draftCardIds: Array<string | null>;
  draftFusionCardIds: string[];
  draftRewardCardIds: string[];
  cardById: Map<string, ICard>;
  selectedSlotIndex: number | null;
  isEditMode: boolean;
  isBusy: boolean;
  isBaseDeckMode: boolean;
  selectedDuelId: string | null;
  onSelectSlot: (slotIndex: number) => void;
  onDropOnSlot: (slotIndex: number, event: DragEvent<HTMLElement>) => void;
  onStartDragSlot: (slotIndex: number, event: DragEvent<HTMLElement>) => void;
  onSetFusionCard: (slotIndex: number, cardId: string) => void;
  onSwapFusionCards: (fromSlotIndex: number, toSlotIndex: number) => void;
  onClearFusionCard: (slotIndex: number) => void;
  onSetRewardCard: (cardId: string | null) => void;
  onClearRewardCard: () => void;
  onInvalidFusionCardDrop: (cardId: string) => void;
}

export function AdminStoryDeckSlotsPanel({
  draftCardIds,
  draftFusionCardIds,
  draftRewardCardIds,
  cardById,
  selectedSlotIndex,
  isEditMode,
  isBusy,
  isBaseDeckMode,
  selectedDuelId,
  onSelectSlot,
  onDropOnSlot,
  onStartDragSlot,
  onSetFusionCard,
  onSwapFusionCards,
  onClearFusionCard,
  onSetRewardCard,
  onClearRewardCard,
  onInvalidFusionCardDrop,
}: IAdminStoryDeckSlotsPanelProps) {
  const isDuelExtrasDisabled = isBusy || !isEditMode || !selectedDuelId || isBaseDeckMode;
  const visibleLength = Math.max(20, draftCardIds.length);
  const filledSlots = draftCardIds.filter((cardId) => cardId !== null).length;

  function onDropOnFusion(slotIndex: number, event: DragEvent<HTMLElement>): void {
    if (isDuelExtrasDisabled) return;
    event.preventDefault();
    const payload = readAdminStarterDeckDragData(event);
    if (!payload) return;
    if (payload.type === "slot" && payload.scope === "FUSION" && payload.slotIndex !== slotIndex) {
      onSwapFusionCards(payload.slotIndex, slotIndex);
      return;
    }
    if (payload.type !== "card") return;
    const card = cardById.get(payload.cardId);
    if (!card || card.type !== "FUSION") {
      onInvalidFusionCardDrop(payload.cardId);
      return;
    }
    onSetFusionCard(slotIndex, payload.cardId);
  }

  function onDropOnReward(event: DragEvent<HTMLElement>): void {
    if (isDuelExtrasDisabled) return;
    event.preventDefault();
    const payload = readAdminStarterDeckDragData(event);
    if (!payload) return;
    if (payload.type === "card") onSetRewardCard(payload.cardId);
    if (payload.type === "slot" && payload.scope === "FUSION") onSetRewardCard(draftFusionCardIds[payload.slotIndex] ?? null);
  }

  return (
    <section className="flex h-full min-h-0 w-full max-w-[470px] flex-col rounded-2xl border border-cyan-800/35 bg-[#030c16]/72 p-4 shadow-[0_0_22px_rgba(8,145,178,0.12)]">
      <div className="mb-3 flex items-center justify-between border-b border-cyan-900/50 pb-2">
        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-cyan-200">Story Deck</h2>
        <p className="rounded border border-cyan-900 bg-black/50 px-2 py-1 text-xs font-semibold text-cyan-100/85">{filledSlots}/{visibleLength}</p>
      </div>
      <div className="home-modern-scroll min-h-0 flex-1 overflow-y-auto p-2">
        <div className="grid w-full grid-cols-5 content-start justify-items-center gap-2 pb-4">
          {Array.from({ length: visibleLength }, (_, slotIndex) => {
            const cardId = draftCardIds[slotIndex] ?? null;
            return (
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
            );
          })}
          {[0, 1].map((slotIndex) => {
            const cardId = draftFusionCardIds[slotIndex] ?? "";
            const card = cardId ? cardById.get(cardId) ?? null : null;
            return (
              <div key={`fusion-${slotIndex}`} className="relative flex w-[76px] flex-col items-center gap-1">
                <HomeMiniCard
                  card={card}
                  label={`Fusion ${slotIndex + 1}`}
                  isDraggable={!isDuelExtrasDisabled && Boolean(cardId)}
                  onDragStart={(event) => cardId ? writeAdminStarterDeckDragData(event, { type: "slot", scope: "FUSION", slotIndex }) : undefined}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => onDropOnFusion(slotIndex, event)}
                  showSlotContainer
                />
                <button type="button" aria-label={`Quitar carta de fusión ${slotIndex + 1}`} className="h-5 w-full rounded border border-rose-700/70 bg-rose-900/20 text-[9px] font-bold uppercase text-rose-200 disabled:opacity-50" onClick={() => onClearFusionCard(slotIndex)} disabled={isDuelExtrasDisabled || !cardId}>
                  Quitar
                </button>
              </div>
            );
          })}
          <div className="relative flex w-[76px] flex-col items-center gap-1">
            <HomeMiniCard
              card={draftRewardCardIds[0] ? cardById.get(draftRewardCardIds[0]) ?? null : null}
              label="Reward"
              isDraggable={!isDuelExtrasDisabled && Boolean(draftRewardCardIds[0])}
              onDragStart={(event) => draftRewardCardIds[0] ? writeAdminStarterDeckDragData(event, { type: "slot", scope: "REWARD", slotIndex: 0 }) : undefined}
              onDragOver={(event) => event.preventDefault()}
              onDrop={onDropOnReward}
              showSlotContainer
            />
            <button type="button" aria-label="Quitar carta de recompensa" className="h-5 w-full rounded border border-rose-700/70 bg-rose-900/20 text-[9px] font-bold uppercase text-rose-200 disabled:opacity-50" onClick={onClearRewardCard} disabled={isDuelExtrasDisabled || !draftRewardCardIds[0]}>
              Quitar
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
