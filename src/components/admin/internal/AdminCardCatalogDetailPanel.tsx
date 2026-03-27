// src/components/admin/internal/AdminCardCatalogDetailPanel.tsx - Muestra detalle de carta seleccionada y acción de edición desde catálogo admin.
"use client";

import { IAdminCardCatalogEntry } from "@/core/entities/admin/IAdminCatalogSnapshot";
import { ICard } from "@/core/entities/ICard";
import { HomeCardInspector } from "@/components/hub/home/HomeCardInspector";

interface IAdminCardCatalogDetailPanelProps {
  selectedEntry: IAdminCardCatalogEntry | null;
  selectedCard: ICard | null;
  canEdit: boolean;
  onEdit: () => void;
  isFormMode: boolean;
  onBack: () => void;
}

export function AdminCardCatalogDetailPanel({ selectedEntry, selectedCard, canEdit, onEdit, isFormMode, onBack }: IAdminCardCatalogDetailPanelProps) {
  return (
    <div className="grid min-h-0 gap-3 grid-rows-[minmax(0,1fr)_auto]">
      <HomeCardInspector selectedCard={selectedCard} selectedCardVersionTier={0} selectedCardLevel={0} selectedCardXp={0} selectedCardMasteryPassiveSkillId={null} minCardScale={0.62} maxCardScale={0.98} />
      <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-3 text-xs text-slate-200">
        {isFormMode ? (
          <>
            <div className="flex items-center justify-between gap-2">
              <p className="font-bold uppercase text-cyan-100">Preview en vivo</p>
              <button type="button" aria-label="Volver al modo catálogo" className="h-8 rounded-md border border-slate-600 px-3 text-[11px] font-bold uppercase text-slate-100" onClick={onBack}>
                Volver
              </button>
            </div>
            <p className="mt-2 text-slate-300">La carta se renderiza con los cambios actuales del formulario.</p>
          </>
        ) : selectedEntry ? (
          <>
            <div className="flex items-center justify-between gap-2">
              <p className="font-bold uppercase text-cyan-100">{selectedEntry.id}</p>
              <button type="button" aria-label="Editar carta seleccionada" className="h-8 rounded-md border border-cyan-500 px-3 text-[11px] font-bold uppercase text-cyan-200 disabled:opacity-50" onClick={onEdit} disabled={!canEdit}>
                Editar
              </button>
            </div>
            <p className="mt-2 text-slate-300">Tipo: {selectedEntry.type} · Facción: {selectedEntry.faction}</p>
            <p className="mt-1 text-slate-300">Coste: {selectedEntry.cost} · Activa: {selectedEntry.isActive ? "Sí" : "No"}</p>
          </>
        ) : (
          <p>Selecciona una carta para ver detalle.</p>
        )}
      </section>
    </div>
  );
}
