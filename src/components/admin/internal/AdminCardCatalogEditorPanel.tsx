// src/components/admin/internal/AdminCardCatalogEditorPanel.tsx - Contenedor del modo edición/alta con formulario y preview en paralelo.
"use client";

import { CardType, ICard } from "@/core/entities/ICard";
import { IAdminCardCatalogDraft } from "@/components/admin/internal/admin-card-catalog-draft";
import { AdminCardCatalogFormFields } from "@/components/admin/internal/AdminCardCatalogFormFields";
import { HomeCardInspector } from "@/components/hub/home/HomeCardInspector";

interface IAdminCardCatalogEditorPanelProps {
  mode: "create" | "edit";
  draft: IAdminCardCatalogDraft;
  previewCard: ICard;
  isBusy: boolean;
  onChange: <K extends keyof IAdminCardCatalogDraft>(key: K, value: IAdminCardCatalogDraft[K]) => void;
  onApplyTypeTemplate?: (nextType: CardType, force: boolean) => void;
  onCancel: () => void;
  onSave: () => Promise<void>;
}

export function AdminCardCatalogEditorPanel({ mode, draft, previewCard, isBusy, onChange, onApplyTypeTemplate, onCancel, onSave }: IAdminCardCatalogEditorPanelProps) {
  return (
    <section className="min-h-0 rounded-2xl border border-slate-700 bg-slate-900/70 p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-cyan-200">{mode === "create" ? "Crear Carta" : "Editar Carta"}</h2>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Cancelar edición de carta" className="h-9 rounded-md border border-slate-600 px-3 text-xs font-bold uppercase text-slate-100" onClick={onCancel} disabled={isBusy}>Cancelar</button>
          <button type="button" aria-label="Guardar carta de catálogo" className="h-9 rounded-md border border-emerald-500 px-3 text-xs font-bold uppercase text-emerald-200 disabled:opacity-50" onClick={() => void onSave()} disabled={isBusy}>Guardar</button>
        </div>
      </div>
      <div className="grid min-h-0 gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <AdminCardCatalogFormFields draft={draft} isBusy={isBusy} onChange={onChange} onApplyTypeTemplate={onApplyTypeTemplate ?? (() => undefined)} />
        <HomeCardInspector selectedCard={previewCard} selectedCardVersionTier={0} selectedCardLevel={0} selectedCardXp={0} selectedCardMasteryPassiveSkillId={null} minCardScale={0.62} maxCardScale={0.98} />
      </div>
    </section>
  );
}
