// src/components/admin/internal/arena/AdminArenaOpponentEditor.tsx - Editor de un oponente de arena (perfil + sus variantes de mazo).
"use client";

import { useState } from "react";
import { ICard } from "@/core/entities/ICard";
import { IAdminArenaOpponent, IAdminArenaVariant, IUpsertArenaOpponentCommand } from "@/core/entities/training/IAdminArena";
import { AdminArenaVariantEditor } from "@/components/admin/internal/arena/AdminArenaVariantEditor";

interface IAdminArenaOpponentEditorProps {
  opponent: IAdminArenaOpponent;
  validCards: ICard[];
  isBusy: boolean;
  onSaveOpponent: (opponent: IUpsertArenaOpponentCommand) => void;
  onDeleteOpponent: (id: string) => void;
  onSaveVariant: (variant: IAdminArenaVariant) => void;
  onDeleteVariant: (id: string) => void;
}

const FIELD = "h-7 rounded border border-slate-600 bg-slate-950/70 px-2 text-[11px] text-slate-100";
type ProfileTextKey = "displayName" | "codeName" | "storyOpponentId" | "avatarUrl" | "introUrl";
const PROFILE_FIELDS: Array<{ key: ProfileTextKey; label: string }> = [
  { key: "displayName", label: "Nombre" },
  { key: "codeName", label: "Code name" },
  { key: "storyOpponentId", label: "Story opponent id" },
  { key: "avatarUrl", label: "Avatar URL" },
  { key: "introUrl", label: "Intro URL" },
];

export function AdminArenaOpponentEditor({ opponent, validCards, isBusy, onSaveOpponent, onDeleteOpponent, onSaveVariant, onDeleteVariant }: IAdminArenaOpponentEditorProps) {
  const { variants, ...profile } = opponent;
  const [draft, setDraft] = useState<IUpsertArenaOpponentCommand>(profile);

  const addVariant = () => onSaveVariant({ id: `${opponent.id}-v-${Math.random().toString(36).slice(2, 7)}`, opponentId: opponent.id, label: "Nueva variante", sortOrder: variants.length + 1, isActive: true, deckCards: [], fusionCards: [] });

  return (
    <details className="rounded-xl border border-cyan-900/45 bg-[#040d1a]/70 p-3" open={false}>
      <summary className="cursor-pointer text-sm font-black uppercase tracking-wide text-cyan-100">
        {draft.displayName} <span className="text-[10px] font-mono text-slate-500">{opponent.id} · {variants.length} variante(s){draft.isActive ? "" : " · inactivo"}</span>
      </summary>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {PROFILE_FIELDS.map((field) => (
          <label key={field.key} className="text-[10px] text-slate-400">{field.label}
            <input aria-label={field.label} className={`${FIELD} mt-0.5 w-full`} value={draft[field.key]} onChange={(event) => setDraft({ ...draft, [field.key]: event.target.value })} />
          </label>
        ))}
        <label className="flex items-end gap-2 text-[11px] text-slate-300">
          <input aria-label="Orden" className={`${FIELD} w-16`} placeholder="Orden" inputMode="numeric" value={draft.sortOrder} onChange={(event) => setDraft({ ...draft, sortOrder: Number(event.target.value) || 0 })} />
          <span className="flex items-center gap-1"><input type="checkbox" aria-label="Oponente activo" checked={draft.isActive} onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })} /> Activo</span>
        </label>
      </div>
      <div className="mt-2 flex justify-end gap-2">
        <button type="button" aria-label="Eliminar oponente" disabled={isBusy} className="h-7 rounded border border-rose-700/50 px-3 text-[10px] font-bold uppercase text-rose-300 hover:bg-rose-900/40 disabled:opacity-50" onClick={() => onDeleteOpponent(opponent.id)}>Eliminar oponente</button>
        <button type="button" aria-label="Guardar oponente" disabled={isBusy} className="h-7 rounded border border-emerald-600/60 bg-emerald-950/40 px-4 text-[10px] font-black uppercase text-emerald-300 hover:bg-emerald-900/50 disabled:opacity-50" onClick={() => onSaveOpponent(draft)}>Guardar oponente</button>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-slate-700/50 pt-2">
        <p className="text-[11px] font-black uppercase tracking-widest text-fuchsia-300">Variantes de mazo</p>
        <button type="button" aria-label="Añadir variante" disabled={isBusy} className="h-7 rounded border border-cyan-600/50 px-2 text-[10px] font-bold uppercase text-cyan-200 hover:bg-cyan-900/40 disabled:opacity-50" onClick={addVariant}>+ Variante</button>
      </div>
      <div className="mt-2 grid gap-2 md:grid-cols-2">
        {variants.map((variant) => (
          <AdminArenaVariantEditor key={variant.id} variant={variant} validCards={validCards} isBusy={isBusy} onSave={onSaveVariant} onDelete={onDeleteVariant} />
        ))}
      </div>
    </details>
  );
}
