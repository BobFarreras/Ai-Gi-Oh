// src/components/admin/internal/arena/AdminArenaVariantEditor.tsx - Editor de una variante de mazo de arena (metadatos + cartas DECK/FUSION).
"use client";

import { useState } from "react";
import { IAdminArenaVariant, IAdminArenaCardEntry, IAdminArenaValidCard } from "@/core/entities/training/IAdminArena";
import { AdminArenaCardList } from "@/components/admin/internal/arena/AdminArenaCardList";

interface IAdminArenaVariantEditorProps {
  variant: IAdminArenaVariant;
  validCards: IAdminArenaValidCard[];
  isBusy: boolean;
  onSave: (variant: IAdminArenaVariant) => void;
  onDelete: (id: string) => void;
}

const FIELD = "h-7 rounded border border-slate-600 bg-slate-950/70 px-2 text-[11px] text-slate-100";

export function AdminArenaVariantEditor({ variant, validCards, isBusy, onSave, onDelete }: IAdminArenaVariantEditorProps) {
  const [draft, setDraft] = useState<IAdminArenaVariant>(variant);
  const setCards = (key: "deckCards" | "fusionCards") => (cards: IAdminArenaCardEntry[]) => setDraft((current) => ({ ...current, [key]: cards }));

  return (
    <div className="rounded-lg border border-fuchsia-900/40 bg-[#0a0716]/50 p-2.5">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <input aria-label="Etiqueta de variante" className={`${FIELD} flex-1`} placeholder="Etiqueta" value={draft.label ?? ""} onChange={(event) => setDraft({ ...draft, label: event.target.value || null })} />
        <input aria-label="Orden de variante" className={`${FIELD} w-16`} placeholder="Orden" inputMode="numeric" value={draft.sortOrder} onChange={(event) => setDraft({ ...draft, sortOrder: Number(event.target.value) || 0 })} />
        <label className="flex items-center gap-1 text-[11px] text-slate-300">
          <input type="checkbox" aria-label="Variante activa" checked={draft.isActive} onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })} /> Activa
        </label>
        <code className="font-mono text-[10px] text-slate-500">{draft.id}</code>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <AdminArenaCardList title="Mazo" cards={draft.deckCards} validCards={validCards} onChange={setCards("deckCards")} />
        <AdminArenaCardList title="Fusión" cards={draft.fusionCards} validCards={validCards} onChange={setCards("fusionCards")} />
      </div>
      <div className="mt-2 flex justify-end gap-2">
        <button type="button" aria-label="Eliminar variante" disabled={isBusy} className="h-7 rounded border border-rose-700/50 px-3 text-[10px] font-bold uppercase text-rose-300 hover:bg-rose-900/40 disabled:opacity-50" onClick={() => onDelete(draft.id)}>Eliminar</button>
        <button type="button" aria-label="Guardar variante" disabled={isBusy} className="h-7 rounded border border-emerald-600/60 bg-emerald-950/40 px-4 text-[10px] font-black uppercase text-emerald-300 hover:bg-emerald-900/50 disabled:opacity-50" onClick={() => onSave(draft)}>Guardar variante</button>
      </div>
    </div>
  );
}
