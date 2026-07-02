// src/components/admin/AdminCatalogPanel.tsx - Panel visual de Card Catalog con almacén, detalle y editor con preview en tiempo real.
"use client";

import { useMemo, useState } from "react";
import { IAdminCatalogSnapshot } from "@/core/entities/admin/IAdminCatalogSnapshot";
import { AdminCardCatalogDetailPanel } from "@/components/admin/internal/AdminCardCatalogDetailPanel";
import { AdminCardCatalogFormFields } from "@/components/admin/internal/AdminCardCatalogFormFields";
import { AdminCardCatalogWarehousePanel } from "@/components/admin/internal/AdminCardCatalogWarehousePanel";
import { AdminMobileDetailDialog } from "@/components/admin/internal/AdminMobileDetailDialog";
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
  const hasErrorFeedback = editor.feedback.toLowerCase().includes("no se pudo") || editor.feedback.toLowerCase().includes("válido");
  // Detalle como diálogo en móvil (<xl); en desktop sigue inline. Se abre al seleccionar carta o editar.
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);
  const beginCreateMobile = () => {
    editor.beginCreate();
    setIsMobileDetailOpen(true);
  };
  const beginEditMobile = () => {
    editor.beginEdit();
    setIsMobileDetailOpen(true);
  };

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col gap-3">
      <div className="relative overflow-hidden rounded-xl border border-cyan-800/50 bg-[linear-gradient(120deg,rgba(4,14,30,0.96),rgba(2,9,20,0.98))] px-4 py-3 shadow-[0_0_20px_rgba(6,182,212,0.12)]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(34,211,238,0.05),transparent_50%,rgba(59,130,246,0.04))]" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-800/60 bg-slate-900/80">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-cyan-400" strokeWidth="1.6">
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <line x1="9" y1="4" x2="9" y2="20" />
                <line x1="12.5" y1="9" x2="18" y2="9" strokeLinecap="round" />
                <line x1="12.5" y1="13" x2="18" y2="13" strokeLinecap="round" />
                <line x1="12.5" y1="17" x2="16" y2="17" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-widest text-cyan-100">Card Catalog</h1>
              <p className="text-[10px] text-slate-400">
                {totalCards} cartas totales · {activeCards} activas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isFormMode ? (
              <>
                <button
                  type="button"
                  aria-label="Volver al catálogo sin guardar"
                  className="flex h-8 items-center gap-1.5 rounded-md border border-slate-600/50 bg-slate-900/50 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-200 transition hover:border-cyan-600/50 hover:text-cyan-300 disabled:opacity-50"
                  onClick={editor.cancelEdit}
                  disabled={editor.isBusy}
                >
                  ← Volver
                </button>
                <button
                  type="button"
                  aria-label="Guardar carta en catálogo"
                  className="flex h-8 items-center gap-1.5 rounded-md border border-emerald-500/70 bg-emerald-950/50 px-4 text-[10px] font-black uppercase tracking-wider text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)] transition hover:bg-emerald-900/50 disabled:opacity-50"
                  onClick={() => void editor.save()}
                  disabled={editor.isBusy}
                >
                  <svg viewBox="0 0 24 24" className="h-3 w-3 fill-none stroke-current" strokeWidth="2.2" strokeLinecap="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
                  Guardar
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  aria-label="Refrescar catálogo de cartas"
                  className="flex h-8 items-center gap-1.5 rounded-md border border-cyan-700/50 bg-cyan-950/40 px-3 text-[10px] font-bold uppercase tracking-wider text-cyan-300 transition hover:bg-cyan-900/40 disabled:opacity-50"
                  onClick={() => void editor.refresh()}
                  disabled={editor.isBusy}
                >
                  <svg viewBox="0 0 24 24" className="h-3 w-3 fill-none stroke-current" strokeWidth="2.2" strokeLinecap="round"><path d="M1 4v6h6M23 20v-6h-6" /><path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15" /></svg>
                  Refrescar
                </button>
                <button
                  type="button"
                  aria-label="Crear carta nueva"
                  className="flex h-8 items-center gap-1.5 rounded-md border border-emerald-500/70 bg-emerald-950/50 px-4 text-[10px] font-black uppercase tracking-wider text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.12)] transition hover:bg-emerald-900/50 disabled:opacity-50"
                  onClick={beginCreateMobile}
                  disabled={editor.isBusy}
                >
                  <svg viewBox="0 0 24 24" className="h-3 w-3 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  Nueva carta
                </button>
              </>
            )}
          </div>
        </div>

        {editor.feedback ? (
          <p className={`relative mt-2 rounded-lg border px-3 py-1.5 text-[11px] font-semibold ${hasErrorFeedback ? "border-rose-500/60 bg-rose-950/30 text-rose-200" : "border-emerald-500/60 bg-emerald-950/30 text-emerald-200"}`}>
            {editor.feedback}
          </p>
        ) : null}
      </div>

      <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        {isFormMode ? (
          <section className="flex min-h-0 flex-col rounded-2xl border border-slate-700/60 bg-[#040d1a]/80 p-3">
            <div className="mb-3 flex items-center justify-between gap-2 border-b border-slate-700/50 pb-3">
              <span className={`rounded-md border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${editor.mode === "create" ? "border-emerald-500/60 bg-emerald-950/50 text-emerald-300" : "border-cyan-500/60 bg-cyan-950/50 text-cyan-300"}`}>
                {editor.mode === "create" ? "Crear carta" : "Editar carta"}
              </span>
              <button type="button" aria-label="Ver preview de la carta" onClick={() => setIsMobileDetailOpen(true)} className="flex h-7 items-center gap-1.5 rounded-md border border-cyan-700/50 bg-cyan-950/40 px-2.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300 xl:hidden">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="1.8"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
                Preview
              </button>
            </div>
            <AdminCardCatalogFormFields draft={editor.draft} isBusy={editor.isBusy} onChange={editor.updateDraft} onApplyTypeTemplate={editor.applyTypeTemplate} />
          </section>
        ) : (
          <AdminCardCatalogWarehousePanel
            cards={editor.cards}
            selectedCardId={editor.selectedCardId}
            cardById={cardById}
            onSelectCard={(cardId) => {
              editor.selectCard(cardId);
              setIsMobileDetailOpen(true);
            }}
          />
        )}
        {/* Detalle inline: solo desktop (xl+). En móvil se muestra en el diálogo de abajo. */}
        <div className="hidden min-h-0 xl:block">
          <AdminCardCatalogDetailPanel
            selectedEntry={editor.selectedEntry}
            selectedCard={detailCard}
            canEdit={editor.mode === "view" && editor.selectedEntry !== null && !editor.isBusy}
            onEdit={editor.beginEdit}
            isFormMode={isFormMode}
            onBack={editor.cancelEdit}
          />
        </div>
      </div>

      <AdminMobileDetailDialog isOpen={isMobileDetailOpen} onClose={() => setIsMobileDetailOpen(false)} closeAriaLabel="Cerrar detalle de carta">
        <AdminCardCatalogDetailPanel
          selectedEntry={editor.selectedEntry}
          selectedCard={detailCard}
          canEdit={editor.mode === "view" && editor.selectedEntry !== null && !editor.isBusy}
          onEdit={beginEditMobile}
          isFormMode={isFormMode}
          onBack={editor.cancelEdit}
        />
      </AdminMobileDetailDialog>
    </section>
  );
}
