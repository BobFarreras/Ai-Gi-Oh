// src/components/admin/AdminCatalogPanel.tsx - Panel visual de Card Catalog con almacén, detalle y editor con preview en tiempo real.
"use client";

import { useMemo } from "react";
import { IAdminCatalogSnapshot } from "@/core/entities/admin/IAdminCatalogSnapshot";
import { AdminCardCatalogDetailPanel } from "@/components/admin/internal/AdminCardCatalogDetailPanel";
import { AdminCardCatalogFormFields } from "@/components/admin/internal/AdminCardCatalogFormFields";
import { AdminCardCatalogWarehousePanel } from "@/components/admin/internal/AdminCardCatalogWarehousePanel";
import { mapEntryToCard } from "@/components/admin/internal/admin-card-catalog-draft";
import { useAdminCardCatalogEditor } from "@/components/admin/internal/use-admin-card-catalog-editor";

interface AdminCatalogPanelProps {
  initialSnapshot: IAdminCatalogSnapshot;
}

export function AdminCatalogPanel({ initialSnapshot }: AdminCatalogPanelProps) {
  const editor = useAdminCardCatalogEditor(initialSnapshot);
  const isFormMode = editor.mode === "create" || editor.mode === "edit";
  const cardById = useMemo(() => new Map(editor.cards.map((entry) => [entry.id, mapEntryToCard(entry)])), [editor.cards]);
  const totalCards = editor.cards.length;
  const activeCards = editor.cards.filter((entry) => entry.isActive).length;
  const detailCard = isFormMode ? editor.draftPreviewCard : editor.selectedPreviewCard;

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col gap-3">
      <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-slate-200">Cartas totales: {totalCards} · Activas: {activeCards}</p>
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Refrescar catálogo de cartas" className="h-9 rounded-md border border-cyan-500 px-3 text-xs font-bold uppercase text-cyan-200" onClick={() => void editor.refresh()} disabled={editor.isBusy}>Refrescar</button>
            <button type="button" aria-label="Crear carta nueva" className="h-9 rounded-md border border-emerald-500 px-3 text-xs font-bold uppercase text-emerald-200" onClick={editor.beginCreate} disabled={editor.isBusy}>Crear carta</button>
          </div>
        </div>
        {editor.feedback ? <p className={`mt-2 rounded-md border px-3 py-2 text-xs font-semibold ${editor.feedback.toLowerCase().includes("no se pudo") || editor.feedback.toLowerCase().includes("válido") ? "border-rose-500/70 bg-rose-900/25 text-rose-100" : "border-emerald-500/70 bg-emerald-900/20 text-emerald-100"}`}>{editor.feedback}</p> : null}
      </div>

      <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        {isFormMode ? (
          <section className="flex min-h-0 flex-col rounded-2xl border border-slate-700 bg-slate-900/70 p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-cyan-200">{editor.mode === "create" ? "Crear Carta" : "Editar Carta"}</h2>
              <div className="flex items-center gap-2">
                <button type="button" aria-label="Volver al catálogo sin guardar" className="h-9 rounded-md border border-slate-600 px-3 text-xs font-bold uppercase text-slate-100" onClick={editor.cancelEdit} disabled={editor.isBusy}>Volver</button>
                <button type="button" aria-label="Guardar carta en catálogo" className="h-9 rounded-md border border-emerald-500 px-3 text-xs font-bold uppercase text-emerald-200 disabled:opacity-50" onClick={() => void editor.save()} disabled={editor.isBusy}>Guardar</button>
              </div>
            </div>
            <AdminCardCatalogFormFields draft={editor.draft} isBusy={editor.isBusy} onChange={editor.updateDraft} onApplyTypeTemplate={editor.applyTypeTemplate} />
          </section>
        ) : (
          <AdminCardCatalogWarehousePanel cards={editor.cards} selectedCardId={editor.selectedCardId} cardById={cardById} onSelectCard={editor.selectCard} />
        )}
        <AdminCardCatalogDetailPanel selectedEntry={editor.selectedEntry} selectedCard={detailCard} canEdit={editor.mode === "view" && editor.selectedEntry !== null && !editor.isBusy} onEdit={editor.beginEdit} isFormMode={isFormMode} onBack={editor.cancelEdit} />
      </div>
    </section>
  );
}
