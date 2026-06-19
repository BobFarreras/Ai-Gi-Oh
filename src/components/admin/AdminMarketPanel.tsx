// src/components/admin/AdminMarketPanel.tsx - Panel visual de mercado admin para gestionar listings y packs con edición guiada.
"use client";

import { useMemo } from "react";
import { AdminMarketListingsWorkspace } from "@/components/admin/internal/AdminMarketListingsWorkspace";
import { AdminMarketPacksWorkspace } from "@/components/admin/internal/AdminMarketPacksWorkspace";
import { mapEntryToCard } from "@/components/admin/internal/admin-card-catalog-draft";
import { useAdminMarketEditor } from "@/components/admin/internal/use-admin-market-editor";
import { IAdminCatalogSnapshot } from "@/core/entities/admin/IAdminCatalogSnapshot";

interface IAdminMarketPanelProps {
  initialSnapshot: IAdminCatalogSnapshot;
}

export function AdminMarketPanel({ initialSnapshot }: IAdminMarketPanelProps) {
  const editor = useAdminMarketEditor(initialSnapshot);
  const cardById = useMemo(() => new Map(editor.snapshot.cards.map((entry) => [entry.id, mapEntryToCard(entry)])), [editor.snapshot.cards]);
  const hasErrorFeedback = editor.feedback.toLowerCase().includes("no se pudo") || editor.feedback.toLowerCase().includes("debe");

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col gap-3">
      <div className="relative overflow-hidden rounded-xl border border-cyan-800/50 bg-[linear-gradient(120deg,rgba(4,14,30,0.96),rgba(2,9,20,0.98))] px-4 py-3 shadow-[0_0_20px_rgba(6,182,212,0.12)]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(34,211,238,0.05),transparent_50%,rgba(59,130,246,0.04))]" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-800/60 bg-slate-900/80">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-cyan-400" strokeWidth="1.6" strokeLinejoin="round">
                <path d="M3 9l1.5-5h15L21 9" strokeLinecap="round" />
                <rect x="3" y="9" width="18" height="12" rx="1.5" />
                <path d="M9 9v3a3 3 0 006 0V9" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-widest text-cyan-100">Market</h1>
              <p className="text-[10px] text-slate-400">
                {editor.snapshot.listings.length} listings · {editor.snapshot.packs.length} packs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-slate-700/50 bg-slate-950/60 p-1">
              <button
                type="button"
                aria-label="Cambiar a vista listings market"
                className={`flex h-8 items-center gap-1.5 rounded-md px-4 text-[10px] font-bold uppercase tracking-wider transition ${editor.tab === "listings" ? "border border-cyan-500/60 bg-cyan-950/50 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.1)]" : "border border-transparent text-slate-400 hover:text-slate-200"}`}
                onClick={() => editor.setTab("listings")}
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><circle cx="3" cy="6" r="1" fill="currentColor" /><circle cx="3" cy="12" r="1" fill="currentColor" /><circle cx="3" cy="18" r="1" fill="currentColor" /></svg>
                Listings
              </button>
              <button
                type="button"
                aria-label="Cambiar a vista packs market"
                className={`flex h-8 items-center gap-1.5 rounded-md px-4 text-[10px] font-bold uppercase tracking-wider transition ${editor.tab === "packs" ? "border border-cyan-500/60 bg-cyan-950/50 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.1)]" : "border border-transparent text-slate-400 hover:text-slate-200"}`}
                onClick={() => editor.setTab("packs")}
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" /><path d="M1 10h22" /></svg>
                Packs
              </button>
            </div>
            <button
              type="button"
              aria-label="Refrescar datos de market"
              className="flex h-8 items-center gap-1.5 rounded-md border border-cyan-700/50 bg-cyan-950/40 px-3 text-[10px] font-bold uppercase tracking-wider text-cyan-300 transition hover:bg-cyan-900/40 disabled:opacity-50"
              onClick={() => void editor.refresh()}
              disabled={editor.isBusy}
            >
              <svg viewBox="0 0 24 24" className="h-3 w-3 fill-none stroke-current" strokeWidth="2.2" strokeLinecap="round"><path d="M1 4v6h6M23 20v-6h-6" /><path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15" /></svg>
              Refrescar
            </button>
          </div>
        </div>

        {editor.feedback ? (
          <p className={`relative mt-2 rounded-lg border px-3 py-1.5 text-[11px] font-semibold ${hasErrorFeedback ? "border-rose-500/60 bg-rose-950/30 text-rose-200" : "border-emerald-500/60 bg-emerald-950/30 text-emerald-200"}`}>
            {editor.feedback}
          </p>
        ) : null}
      </div>

      {editor.tab === "listings" ? (
        <AdminMarketListingsWorkspace
          cards={editor.snapshot.cards}
          cardById={cardById}
          listingByCardId={editor.listingByCardId}
          selectedCardId={editor.selectedCardId}
          draft={editor.listingDraft}
          isBusy={editor.isBusy}
          onSelectCard={editor.selectCard}
          onUpdateDraft={editor.updateListingDraft}
          onSave={editor.saveListing}
        />
      ) : (
        <AdminMarketPacksWorkspace
          cards={editor.snapshot.cards}
          cardById={cardById}
          packs={editor.snapshot.packs}
          selectedPackId={editor.selectedPackId}
          isEditMode={editor.isPackEditMode}
          isBusy={editor.isBusy}
          draft={editor.packDraft}
          onSelectPack={editor.selectPack}
          onBeginCreate={editor.beginCreatePack}
          onBeginEdit={editor.beginEditPack}
          onCancel={editor.cancelPackEdit}
          onSave={editor.savePack}
          onDeletePack={editor.deletePack}
          onUpdateDraft={editor.updatePackDraft}
          onUpdatePoolEntry={editor.updatePackPoolEntry}
          onAddPoolEntry={editor.addPackPoolEntry}
          onRemovePoolEntry={editor.removePackPoolEntry}
          onRemovePoolEntries={editor.removePackPoolEntries}
        />
      )}
    </section>
  );
}
