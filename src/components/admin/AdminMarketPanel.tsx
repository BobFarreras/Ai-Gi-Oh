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

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col gap-3">
      <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-slate-200">Listings: {editor.snapshot.listings.length} · Packs: {editor.snapshot.packs.length}</p>
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Cambiar a vista listings market" className={`h-9 rounded-md border px-3 text-xs font-bold uppercase ${editor.tab === "listings" ? "border-cyan-300 bg-cyan-500/20 text-cyan-100" : "border-slate-600 text-slate-100"}`} onClick={() => editor.setTab("listings")}>Listings</button>
            <button type="button" aria-label="Cambiar a vista packs market" className={`h-9 rounded-md border px-3 text-xs font-bold uppercase ${editor.tab === "packs" ? "border-cyan-300 bg-cyan-500/20 text-cyan-100" : "border-slate-600 text-slate-100"}`} onClick={() => editor.setTab("packs")}>Packs</button>
            <button type="button" aria-label="Refrescar datos de market" className="h-9 rounded-md border border-cyan-500 px-3 text-xs font-bold uppercase text-cyan-200" onClick={() => void editor.refresh()} disabled={editor.isBusy}>Refrescar</button>
          </div>
        </div>
        {editor.feedback ? <p className={`mt-2 rounded-md border px-3 py-2 text-xs font-semibold ${editor.feedback.toLowerCase().includes("no se pudo") || editor.feedback.toLowerCase().includes("debe") ? "border-rose-500/70 bg-rose-900/25 text-rose-100" : "border-emerald-500/70 bg-emerald-900/20 text-emerald-100"}`}>{editor.feedback}</p> : null}
      </div>

      {editor.tab === "listings" ? (
        <AdminMarketListingsWorkspace cards={editor.snapshot.cards} cardById={cardById} listingByCardId={editor.listingByCardId} selectedCardId={editor.selectedCardId} draft={editor.listingDraft} isBusy={editor.isBusy} onSelectCard={editor.selectCard} onUpdateDraft={editor.updateListingDraft} onSave={editor.saveListing} />
      ) : (
        <AdminMarketPacksWorkspace cards={editor.snapshot.cards} cardById={cardById} packs={editor.snapshot.packs} selectedPackId={editor.selectedPackId} isEditMode={editor.isPackEditMode} isBusy={editor.isBusy} draft={editor.packDraft} onSelectPack={editor.selectPack} onBeginCreate={editor.beginCreatePack} onBeginEdit={editor.beginEditPack} onCancel={editor.cancelPackEdit} onSave={editor.savePack} onDeletePack={editor.deletePack} onUpdateDraft={editor.updatePackDraft} onUpdatePoolEntry={editor.updatePackPoolEntry} onAddPoolEntry={editor.addPackPoolEntry} onRemovePoolEntry={editor.removePackPoolEntry} onRemovePoolEntries={editor.removePackPoolEntries} />
      )}
    </section>
  );
}
