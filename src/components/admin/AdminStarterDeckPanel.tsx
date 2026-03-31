// src/components/admin/AdminStarterDeckPanel.tsx - Composición principal del editor starter deck con layout tipo Arsenal para administración.
"use client";
import { DragEvent, useMemo } from "react";
import { IAdminStarterDeckApiResponse } from "@/components/admin/admin-starter-deck-api";
import { HomeCardInspector } from "@/components/hub/home/HomeCardInspector";
import { AdminStarterDeckCollectionPanel } from "@/components/admin/internal/AdminStarterDeckCollectionPanel";
import { AdminStarterDeckDeckPanel } from "@/components/admin/internal/AdminStarterDeckDeckPanel";
import { readAdminStarterDeckDragData, writeAdminStarterDeckDragData } from "@/components/admin/internal/admin-starter-deck-dnd";
import { useAdminStarterDeckEditor } from "@/components/admin/internal/use-admin-starter-deck-editor";
interface IAdminStarterDeckPanelProps {
  initialData: IAdminStarterDeckApiResponse;
}

export function AdminStarterDeckPanel({ initialData }: IAdminStarterDeckPanelProps) {
  const editor = useAdminStarterDeckEditor(initialData);
  const cardById = useMemo(() => new Map(editor.data.availableCards.map((card) => [card.id, card])), [editor.data.availableCards]);
  const selectedSlotCardId = editor.selectedSlotIndex === null ? null : (editor.draftCardIds[editor.selectedSlotIndex] ?? null);
  const selectedCard = (editor.selectedCollectionCardId ? cardById.get(editor.selectedCollectionCardId) ?? null : null) ?? (selectedSlotCardId ? cardById.get(selectedSlotCardId) ?? null : null);
  const hasErrorFeedback = editor.feedback.toLowerCase().includes("no se pudo") || editor.feedback.toLowerCase().includes("debes ");

  function onDropOnSlot(slotIndex: number, event: DragEvent<HTMLElement>): void {
    if (!editor.isEditMode) return;
    event.preventDefault();
    const payload = readAdminStarterDeckDragData(event);
    if (!payload) return;
    if (payload.type === "card") editor.setDraftCardIdBySlot(slotIndex, payload.cardId);
    if (payload.type === "slot" && payload.slotIndex !== slotIndex) editor.swapSlots(payload.slotIndex, slotIndex);
    editor.setSelectedSlotIndex(slotIndex);
  }

  function onDropToCollection(event: DragEvent<HTMLElement>): void {
    if (!editor.isEditMode) return;
    event.preventDefault();
    const payload = readAdminStarterDeckDragData(event);
    if (!payload || payload.type !== "slot") return;
    editor.clearSlotCardByIndex(payload.slotIndex);
  }

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col space-y-4">
      <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-200">
            Plantilla activa/objetivo
            <select
              aria-label="Seleccionar plantilla starter deck"
              className="ml-2 h-9 rounded-md border border-slate-600 bg-slate-900 px-2 text-xs text-slate-100"
              value={editor.data.template?.templateKey ?? ""}
              disabled={editor.isBusy || editor.data.summaries.length === 0}
              onChange={(event) => void editor.onSelectTemplate(event.target.value)}
            >
              {editor.data.summaries.map((summary) => (
                <option key={summary.templateKey} value={summary.templateKey}>
                  {summary.templateKey} {summary.isActive ? "(activo)" : ""}
                </option>
              ))}
            </select>
          </label>
          <button type="button" aria-label="Refrescar starter deck" className="h-9 rounded-md border border-cyan-500 px-3 text-xs font-bold uppercase text-cyan-200" onClick={() => void editor.onRefresh()} disabled={editor.isBusy}>
            Refrescar
          </button>
          <button type="button" aria-label="Activar o desactivar modo edición starter deck" className="h-9 rounded-md border border-slate-600 px-3 text-xs font-bold uppercase text-slate-100" onClick={() => editor.setIsEditMode(!editor.isEditMode)} disabled={editor.isBusy || !editor.data.template}>
            {editor.isEditMode ? "Salir de edición" : "Editar plantilla"}
          </button>
          <button
            type="button"
            aria-label="Aplicar carta seleccionada al slot activo"
            className="h-9 rounded-md border border-slate-600 px-3 text-xs font-bold uppercase text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!editor.isEditMode || editor.selectedSlotIndex === null || !editor.selectedCollectionCardId}
            onClick={() => {
              if (editor.selectedSlotIndex === null || !editor.selectedCollectionCardId) return;
              editor.setDraftCardIdBySlot(editor.selectedSlotIndex, editor.selectedCollectionCardId);
            }}
          >
            Poner en slot
          </button>
          <button
            type="button"
            aria-label="Quitar carta del slot activo"
            className="h-9 rounded-md border border-rose-600 px-3 text-xs font-bold uppercase text-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!editor.isEditMode || editor.selectedSlotIndex === null}
            onClick={() => {
              if (editor.selectedSlotIndex === null) return;
              editor.clearSlotCardByIndex(editor.selectedSlotIndex);
            }}
          >
            Quitar del slot
          </button>
          <label className="inline-flex h-9 items-center gap-2 text-xs text-slate-200">
            <input type="checkbox" checked={editor.activateOnSave} disabled={!editor.isEditMode || editor.isBusy} onChange={(event) => editor.setActivateOnSave(event.target.checked)} />
            Activar plantilla al guardar
          </label>
          <button type="button" aria-label="Guardar starter deck" className="h-9 rounded-md border border-emerald-500 px-3 text-xs font-bold uppercase text-emerald-200 disabled:cursor-not-allowed disabled:opacity-50" onClick={() => void editor.onSave()} disabled={!editor.isEditMode || editor.isBusy || !editor.data.template || !editor.canSave}>
            Guardar
          </button>
        </div>
        {editor.feedback ? (
          <p className={`mt-2 rounded-md border px-3 py-2 text-xs font-semibold ${hasErrorFeedback ? "border-rose-500/70 bg-rose-900/25 text-rose-100" : "border-emerald-500/70 bg-emerald-900/20 text-emerald-100"}`}>
            {editor.feedback}
          </p>
        ) : null}
      </div>
      {editor.data.template ? (
        <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[360px_470px_minmax(0,1fr)]">
          <HomeCardInspector
            selectedCard={selectedCard}
            selectedCardVersionTier={0}
            selectedCardLevel={0}
            selectedCardXp={0}
            selectedCardMasteryPassiveSkillId={null}
            minCardScale={0.62}
            maxCardScale={0.98}
          />
          <div className="flex min-h-0 justify-center xl:justify-start">
            <AdminStarterDeckDeckPanel
              draftCardIds={editor.draftCardIds}
              cardById={cardById}
              selectedSlotIndex={editor.selectedSlotIndex}
              isEditMode={editor.isEditMode}
              onSelectSlot={(slotIndex) => {
                editor.setSelectedSlotIndex(slotIndex);
                editor.setSelectedCollectionCardId(null);
              }}
              onDropOnSlot={onDropOnSlot}
              onStartDragSlot={(slotIndex, event) => {
                if (!editor.isEditMode || !editor.draftCardIds[slotIndex]) return;
                writeAdminStarterDeckDragData(event, { type: "slot", slotIndex });
              }}
            />
          </div>
          <AdminStarterDeckCollectionPanel
            availableCards={editor.data.availableCards}
            selectedCardId={editor.selectedCollectionCardId}
            isEditMode={editor.isEditMode}
            onSelectCard={(cardId) => {
              editor.setSelectedCollectionCardId(cardId);
              editor.setSelectedSlotIndex(null);
            }}
            onDropToCollection={onDropToCollection}
            onStartDragCard={(cardId, event) => writeAdminStarterDeckDragData(event, { type: "card", cardId })}
          />
        </div>
      ) : (
        <p className="rounded-lg border border-amber-500/60 bg-amber-900/20 p-3 text-xs text-amber-100">
          No hay plantilla starter disponible todavía.
        </p>
      )}
    </section>
  );
}
