// src/components/admin/internal/arena/AdminArenaOpponentColumn.tsx - Columna izquierda del editor de arena: lista de oponentes + variantes de mazo.
"use client";

import Image from "next/image";
import { IAdminArenaOpponent } from "@/core/entities/training/IAdminArena";

interface IAdminArenaOpponentColumnProps {
  opponents: IAdminArenaOpponent[];
  selectedOpponentId: string | null;
  selectedVariantId: string | null;
  onSelectOpponent: (id: string) => void;
  onSelectVariant: (id: string) => void;
}

/** Selector visual de oponente y de su variante de mazo activa (los decks rotan entre variantes). */
export function AdminArenaOpponentColumn({ opponents, selectedOpponentId, selectedVariantId, onSelectOpponent, onSelectVariant }: IAdminArenaOpponentColumnProps) {
  const selected = opponents.find((opp) => opp.id === selectedOpponentId) ?? opponents[0] ?? null;
  return (
    <section className="flex h-full min-h-0 w-[210px] flex-col rounded-2xl border border-cyan-800/30 bg-[#031020]/55 p-3">
      <h2 className="mb-2 text-sm font-black uppercase tracking-[0.18em] text-cyan-200">Oponentes</h2>
      <div className="home-modern-scroll flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pr-1">
        {opponents.map((opponent) => {
          const isActive = (selected?.id ?? null) === opponent.id;
          return (
            <button
              key={opponent.id}
              type="button"
              aria-label={`Seleccionar oponente ${opponent.displayName}`}
              onClick={() => onSelectOpponent(opponent.id)}
              className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition ${isActive ? "border-cyan-400/70 bg-cyan-950/60" : "border-slate-700/50 bg-slate-950/40 hover:border-cyan-700/50"}`}
            >
              <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md border border-cyan-900/60 bg-slate-900">
                {opponent.avatarUrl ? <Image src={opponent.avatarUrl} alt={opponent.displayName} fill className="object-cover" sizes="32px" /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-bold text-cyan-100">{opponent.displayName}</span>
                <span className="block text-[9px] uppercase tracking-wider text-slate-500">{opponent.variants.length} variantes{opponent.isActive ? "" : " · inactivo"}</span>
              </span>
            </button>
          );
        })}
        {opponents.length === 0 ? <p className="text-[11px] text-slate-500">Sin oponentes. Créalos en la pestaña «Estructura».</p> : null}
      </div>

      {selected ? (
        <div className="mt-2 border-t border-cyan-900/40 pt-2">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-600/80">Variante de mazo</p>
          <div className="flex flex-wrap gap-1">
            {selected.variants.map((variant) => {
              const isActive = (selectedVariantId ?? selected.variants[0]?.id) === variant.id;
              return (
                <button
                  key={variant.id}
                  type="button"
                  aria-label={`Seleccionar variante ${variant.label ?? variant.id}`}
                  onClick={() => onSelectVariant(variant.id)}
                  className={`rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition ${isActive ? "border-emerald-300/65 bg-emerald-500/20 text-emerald-100" : "border-slate-700/50 bg-slate-900/50 text-slate-300 hover:border-cyan-700/50"}`}
                >
                  {variant.label ?? variant.id}
                </button>
              );
            })}
            {selected.variants.length === 0 ? <p className="text-[10px] text-slate-500">Sin variantes.</p> : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
