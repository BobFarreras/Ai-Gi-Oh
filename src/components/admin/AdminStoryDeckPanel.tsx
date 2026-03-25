// src/components/admin/AdminStoryDeckPanel.tsx - Panel principal para administrar mazos Story por oponente con edición visual y guardado seguro.
"use client";

import { DragEvent, useMemo } from "react";
import { IAdminStoryDeckApiResponse } from "@/components/admin/admin-story-deck-api";
import { AdminStarterDeckCollectionPanel } from "@/components/admin/internal/AdminStarterDeckCollectionPanel";
import { AdminStoryDeckSlotsPanel } from "@/components/admin/internal/AdminStoryDeckSlotsPanel";
import { AdminStoryOpponentCatalog } from "@/components/admin/internal/AdminStoryOpponentCatalog";
import { readAdminStarterDeckDragData, writeAdminStarterDeckDragData } from "@/components/admin/internal/admin-starter-deck-dnd";
import { useAdminStoryDeckEditor } from "@/components/admin/internal/use-admin-story-deck-editor";
import { HomeCardInspector } from "@/components/hub/home/HomeCardInspector";

interface IAdminStoryDeckPanelProps {
  initialData: IAdminStoryDeckApiResponse;
}

export function AdminStoryDeckPanel({ initialData }: IAdminStoryDeckPanelProps) {
  const editor = useAdminStoryDeckEditor(initialData);
  const cardById = useMemo(() => new Map(editor.data.availableCards.map((card) => [card.id, card])), [editor.data.availableCards]);
  const selectedSlotCardId = editor.selectedSlotIndex === null ? null : (editor.draftCardIds[editor.selectedSlotIndex] ?? null);
  const selectedCard = (editor.selectedCollectionCardId ? cardById.get(editor.selectedCollectionCardId) ?? null : null) ?? (selectedSlotCardId ? cardById.get(selectedSlotCardId) ?? null : null);
  const selectedOpponentId = editor.data.deck?.opponentId ?? editor.data.opponents[0]?.opponentId ?? null;
  const selectedDeckDuels = editor.data.duels.filter((duel) => duel.deckListId === editor.data.deck?.deckListId);

  function onDropOnSlot(slotIndex: number, event: DragEvent<HTMLElement>): void {
    if (!editor.isEditMode) return;
    event.preventDefault();
    const payload = readAdminStarterDeckDragData(event);
    if (!payload) return;
    if (payload.type === "card") editor.setDraftCardIdBySlot(slotIndex, payload.cardId);
    if (payload.type === "slot" && payload.slotIndex !== slotIndex) editor.swapSlots(payload.slotIndex, slotIndex);
    editor.setSelectedSlotIndex(slotIndex);
  }

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col gap-3">
      <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <select aria-label="Seleccionar deck story" className="h-9 rounded-md border border-slate-600 bg-slate-900 px-2 text-xs text-slate-100" value={editor.data.deck?.deckListId ?? ""} onChange={(event) => void editor.onSelectDeck(event.target.value)} disabled={editor.isBusy || editor.data.decks.length === 0}>
            {editor.data.decks.map((deck) => <option key={deck.deckListId} value={deck.deckListId}>{deck.name} v{deck.version} {deck.isActive ? "(activo)" : ""}</option>)}
          </select>
          <button type="button" aria-label="Refrescar story decks" className="h-9 rounded-md border border-cyan-500 px-3 text-xs font-bold uppercase text-cyan-200" onClick={() => void editor.onRefresh()} disabled={editor.isBusy}>Refrescar</button>
          <button type="button" aria-label="Activar o desactivar edición story deck" className="h-9 rounded-md border border-slate-600 px-3 text-xs font-bold uppercase text-slate-100" onClick={() => editor.setIsEditMode(!editor.isEditMode)} disabled={editor.isBusy || !editor.data.deck}>{editor.isEditMode ? "Salir de edición" : "Editar deck"}</button>
          <button type="button" aria-label="Aplicar carta seleccionada al slot story" className="h-9 rounded-md border border-slate-600 px-3 text-xs font-bold uppercase text-slate-100 disabled:opacity-50" disabled={!editor.isEditMode || editor.selectedSlotIndex === null || !editor.selectedCollectionCardId} onClick={() => editor.selectedSlotIndex !== null && editor.selectedCollectionCardId ? editor.setDraftCardIdBySlot(editor.selectedSlotIndex, editor.selectedCollectionCardId) : undefined}>Poner en slot</button>
          <button type="button" aria-label="Quitar carta del slot story" className="h-9 rounded-md border border-rose-600 px-3 text-xs font-bold uppercase text-rose-200 disabled:opacity-50" disabled={!editor.isEditMode || editor.selectedSlotIndex === null} onClick={() => editor.selectedSlotIndex !== null ? editor.clearSlotCardByIndex(editor.selectedSlotIndex) : undefined}>Quitar</button>
          <button type="button" aria-label="Guardar story deck" className="h-9 rounded-md border border-emerald-500 px-3 text-xs font-bold uppercase text-emerald-200 disabled:opacity-50" onClick={() => void editor.onSave()} disabled={!editor.isEditMode || editor.isBusy || !editor.canSave}>Guardar</button>
        </div>
        {selectedDeckDuels.length > 0 ? <p className="mt-2 text-xs text-slate-300">Se usa en: {selectedDeckDuels.map((duel) => `Ch${duel.chapter}-${duel.duelIndex}`).join(", ")}</p> : null}
        {editor.feedback ? <p className={`mt-2 rounded-md border px-3 py-2 text-xs font-semibold ${editor.feedback.toLowerCase().includes("no se pudo") ? "border-rose-500/70 bg-rose-900/25 text-rose-100" : "border-emerald-500/70 bg-emerald-900/20 text-emerald-100"}`}>{editor.feedback}</p> : null}
      </div>
      <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[auto_470px_minmax(0,1fr)_360px]">
        <AdminStoryOpponentCatalog opponents={editor.data.opponents} selectedOpponentId={selectedOpponentId} onSelectOpponent={(opponentId) => void editor.onSelectOpponent(opponentId)} />
        <div className="flex min-h-0 justify-center xl:justify-start">
          <AdminStoryDeckSlotsPanel draftCardIds={editor.draftCardIds} cardById={cardById} selectedSlotIndex={editor.selectedSlotIndex} isEditMode={editor.isEditMode} onSelectSlot={(slotIndex) => { editor.setSelectedSlotIndex(slotIndex); editor.setSelectedCollectionCardId(null); }} onDropOnSlot={onDropOnSlot} onStartDragSlot={(slotIndex, event) => editor.isEditMode && editor.draftCardIds[slotIndex] ? writeAdminStarterDeckDragData(event, { type: "slot", slotIndex }) : undefined} />
        </div>
        <AdminStarterDeckCollectionPanel availableCards={editor.data.availableCards} selectedCardId={editor.selectedCollectionCardId} isEditMode={editor.isEditMode} onSelectCard={(cardId) => { editor.setSelectedCollectionCardId(cardId); editor.setSelectedSlotIndex(null); }} onDropToCollection={(event) => { if (!editor.isEditMode) return; event.preventDefault(); const payload = readAdminStarterDeckDragData(event); if (payload?.type === "slot") editor.clearSlotCardByIndex(payload.slotIndex); }} onStartDragCard={(cardId, event) => writeAdminStarterDeckDragData(event, { type: "card", cardId })} />
        <HomeCardInspector selectedCard={selectedCard} selectedCardVersionTier={0} selectedCardLevel={0} selectedCardXp={0} selectedCardMasteryPassiveSkillId={null} minCardScale={0.62} maxCardScale={0.95} />
      </div>
    </section>
  );
}
