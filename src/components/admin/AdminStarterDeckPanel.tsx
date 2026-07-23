// src/components/admin/AdminStarterDeckPanel.tsx - Composición principal del editor starter deck con layout tipo Arsenal para administración.
"use client";
import { ADMIN_FEEDBACK_TONE_CLASS } from "@/components/admin/internal/admin-feedback-styles";
import { DragEvent, useMemo, useState } from "react";
import { IAdminStarterDeckApiResponse } from "@/components/admin/admin-starter-deck-api";
import { HomeCardInspector } from "@/components/hub/home/HomeCardInspector";
import { AdminMobileDetailDialog } from "@/components/admin/internal/AdminMobileDetailDialog";
import { AdminStarterDeckCollectionPanel } from "@/components/admin/internal/AdminStarterDeckCollectionPanel";
import { AdminStarterDeckDeckPanel } from "@/components/admin/internal/AdminStarterDeckDeckPanel";
import { readAdminStarterDeckDragData, writeAdminStarterDeckDragData } from "@/components/admin/internal/admin-starter-deck-dnd";
import { useAdminStarterDeckEditor } from "@/components/admin/internal/use-admin-starter-deck-editor";

interface IAdminStarterDeckPanelProps {
  initialData: IAdminStarterDeckApiResponse;
}

export function AdminStarterDeckPanel({ initialData }: IAdminStarterDeckPanelProps) {
  const editor = useAdminStarterDeckEditor(initialData);
  const [isMobileInspectorOpen, setIsMobileInspectorOpen] = useState(false);
  const cardById = useMemo(() => new Map(editor.data.availableCards.map((card) => [card.id, card])), [editor.data.availableCards]);
  const selectedSlotCardId = editor.selectedSlotIndex === null ? null : (editor.draftCardIds[editor.selectedSlotIndex] ?? null);
  const selectedCard = (editor.selectedCollectionCardId ? cardById.get(editor.selectedCollectionCardId) ?? null : null) ?? (selectedSlotCardId ? cardById.get(selectedSlotCardId) ?? null : null);
  const filledSlots = editor.draftCardIds.filter((id) => typeof id === "string" && id.length > 0).length;
  const totalSlots = editor.draftCardIds.length;
  const feedbackTone = editor.feedback.tone;

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
    <section className="flex h-full min-h-0 flex-1 flex-col gap-3">
      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-xl border border-cyan-800/50 bg-[linear-gradient(120deg,rgba(4,14,30,0.96),rgba(2,9,20,0.98))] px-4 py-3 shadow-[0_0_20px_rgba(6,182,212,0.12)]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(34,211,238,0.05),transparent_50%,rgba(59,130,246,0.04))]" />
        <div className="relative flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-800/60 bg-slate-900/80">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-cyan-400" strokeWidth="1.6" strokeLinecap="round">
                <rect x="5" y="3" width="14" height="18" rx="2" />
                <line x1="8.5" y1="8" x2="15.5" y2="8" />
                <line x1="8.5" y1="12" x2="15.5" y2="12" />
                <line x1="8.5" y1="16" x2="12" y2="16" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-black uppercase tracking-widest text-cyan-100">Starter Deck</h1>
              <div className="flex items-center gap-2">
                <select
                  aria-label="Seleccionar plantilla starter deck"
                  className="h-6 rounded-md border border-cyan-800/50 bg-slate-950/80 px-2 text-[10px] font-semibold text-slate-200 focus:border-cyan-500 focus:outline-none"
                  value={editor.data.template?.templateKey ?? ""}
                  disabled={editor.isBusy || editor.data.summaries.length === 0}
                  onChange={(event) => void editor.onSelectTemplate(event.target.value)}
                >
                  {editor.data.summaries.map((summary) => (
                    <option key={summary.templateKey} value={summary.templateKey}>
                      {summary.templateKey} {summary.isActive ? "✓" : ""}
                    </option>
                  ))}
                </select>
                {editor.data.template && (
                  <span className="text-[10px] text-slate-400">
                    {filledSlots}/{totalSlots} slots
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              aria-label="Refrescar starter deck"
              className="flex h-8 items-center gap-1.5 rounded-md border border-cyan-700/50 bg-cyan-950/40 px-3 text-[10px] font-bold uppercase tracking-wider text-cyan-300 transition hover:bg-cyan-900/40 disabled:opacity-50"
              onClick={() => void editor.onRefresh()}
              disabled={editor.isBusy}
            >
              <svg viewBox="0 0 24 24" className="h-3 w-3 fill-none stroke-current" strokeWidth="2.2" strokeLinecap="round"><path d="M1 4v6h6M23 20v-6h-6" /><path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15" /></svg>
              Refrescar
            </button>

            <div className="flex items-center gap-1.5 rounded-lg border border-slate-700/50 bg-slate-950/60 p-1">
              <button
                type="button"
                aria-label="Activar o desactivar modo edición starter deck"
                className={`flex h-7 items-center gap-1.5 rounded-md border px-3 text-[10px] font-bold uppercase tracking-wider transition disabled:opacity-50 ${editor.isEditMode ? "border-amber-500/60 bg-amber-950/40 text-amber-300" : "border-slate-600/50 bg-slate-900/50 text-slate-200 hover:border-cyan-600/50 hover:text-cyan-300"}`}
                onClick={() => editor.setIsEditMode(!editor.isEditMode)}
                disabled={editor.isBusy || !editor.data.template}
              >
                {editor.isEditMode ? "Salir" : "Editar"}
              </button>

              {editor.isEditMode && (
                <>
                  <button
                    type="button"
                    aria-label="Aplicar carta seleccionada al slot activo"
                    className="flex h-7 items-center gap-1.5 rounded-md border border-slate-600/50 bg-slate-900/50 px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-200 transition hover:border-cyan-600/50 hover:text-cyan-300 disabled:opacity-40"
                    disabled={editor.selectedSlotIndex === null || !editor.selectedCollectionCardId}
                    onClick={() => {
                      if (editor.selectedSlotIndex === null || !editor.selectedCollectionCardId) return;
                      editor.setDraftCardIdBySlot(editor.selectedSlotIndex, editor.selectedCollectionCardId);
                    }}
                  >
                    ↓ Slot
                  </button>
                  <button
                    type="button"
                    aria-label="Quitar carta del slot activo"
                    className="flex h-7 items-center gap-1.5 rounded-md border border-rose-700/50 bg-rose-950/40 px-2.5 text-[10px] font-bold uppercase tracking-wider text-rose-300 transition hover:bg-rose-900/40 disabled:opacity-40"
                    disabled={editor.selectedSlotIndex === null}
                    onClick={() => {
                      if (editor.selectedSlotIndex === null) return;
                      editor.clearSlotCardByIndex(editor.selectedSlotIndex);
                    }}
                  >
                    ✕
                  </button>
                </>
              )}
            </div>

            {editor.isEditMode && (
              <label className="flex h-8 items-center gap-1.5 rounded-md border border-slate-600/50 bg-slate-900/50 px-2.5 text-[10px] font-semibold text-slate-300">
                <input
                  type="checkbox"
                  checked={editor.activateOnSave}
                  disabled={editor.isBusy}
                  onChange={(event) => editor.setActivateOnSave(event.target.checked)}
                  className="rounded"
                />
                Activar al guardar
              </label>
            )}

            <button
              type="button"
              aria-label="Guardar starter deck"
              className="flex h-8 items-center gap-1.5 rounded-md border border-emerald-500/70 bg-emerald-950/50 px-4 text-[10px] font-black uppercase tracking-wider text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)] transition hover:bg-emerald-900/50 hover:shadow-[0_0_14px_rgba(16,185,129,0.25)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              onClick={() => void editor.onSave()}
              disabled={!editor.isEditMode || editor.isBusy || !editor.data.template || !editor.canSave}
            >
              <svg viewBox="0 0 24 24" className="h-3 w-3 fill-none stroke-current" strokeWidth="2.2" strokeLinecap="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
              Guardar
            </button>
          </div>
        </div>

        {editor.feedback.message ? (
          <p className={`relative mt-2 rounded-lg border px-3 py-1.5 text-[11px] font-semibold ${ADMIN_FEEDBACK_TONE_CLASS[feedbackTone]}`}>
            {editor.feedback.message}
          </p>
        ) : null}
      </div>

      {editor.data.template ? (
        <div className="grid min-h-0 flex-1 gap-4 max-xl:flex max-xl:flex-col max-xl:overflow-y-auto xl:grid-cols-[360px_470px_minmax(0,1fr)]">
          {/* Inspector inline solo en desktop; en móvil se abre como diálogo al seleccionar carta/slot. */}
          <div className="hidden min-h-0 xl:block">
            <HomeCardInspector
              selectedCard={selectedCard}
              selectedCardVersionTier={0}
              selectedCardLevel={0}
              selectedCardXp={0}
              selectedCardMasteryPassiveSkillId={null}
              minCardScale={0.62}
              maxCardScale={0.98}
            />
          </div>
          <div className="flex min-h-0 justify-center max-xl:shrink-0 xl:justify-start">
            <AdminStarterDeckDeckPanel
              draftCardIds={editor.draftCardIds}
              cardById={cardById}
              selectedSlotIndex={editor.selectedSlotIndex}
              isEditMode={editor.isEditMode}
              onSelectSlot={(slotIndex) => {
                editor.setSelectedSlotIndex(slotIndex);
                editor.setSelectedCollectionCardId(null);
                setIsMobileInspectorOpen(true);
              }}
              onDropOnSlot={onDropOnSlot}
              onStartDragSlot={(slotIndex, event) => {
                if (!editor.isEditMode || !editor.draftCardIds[slotIndex]) return;
                writeAdminStarterDeckDragData(event, { type: "slot", slotIndex });
              }}
            />
          </div>
          <div className="min-h-0 max-xl:h-[68vh] max-xl:shrink-0 xl:h-full">
            <AdminStarterDeckCollectionPanel
              availableCards={editor.data.availableCards}
              selectedCardId={editor.selectedCollectionCardId}
              isEditMode={editor.isEditMode}
              onSelectCard={(cardId) => {
                editor.setSelectedCollectionCardId(cardId);
                editor.setSelectedSlotIndex(null);
                setIsMobileInspectorOpen(true);
              }}
              onDropToCollection={onDropToCollection}
              onStartDragCard={(cardId, event) => writeAdminStarterDeckDragData(event, { type: "card", cardId })}
            />
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-4">
          <p className="text-sm font-semibold text-amber-200">No hay plantilla starter disponible todavía.</p>
        </div>
      )}

      <AdminMobileDetailDialog isOpen={isMobileInspectorOpen} onClose={() => setIsMobileInspectorOpen(false)} closeAriaLabel="Cerrar detalle de carta">
        <HomeCardInspector
          selectedCard={selectedCard}
          selectedCardVersionTier={0}
          selectedCardLevel={0}
          selectedCardXp={0}
          selectedCardMasteryPassiveSkillId={null}
          minCardScale={0.62}
          maxCardScale={0.98}
        />
      </AdminMobileDetailDialog>
    </section>
  );
}
