// src/components/admin/internal/AdminStoryDuelCatalog.tsx - Catálogo lateral de duelos Story por oponente con selector rápido y navegación de retorno.
"use client";

import { IAdminStoryDuelReference } from "@/core/entities/admin/IAdminStoryDeck";

interface IAdminStoryDuelCatalogProps {
  duels: IAdminStoryDuelReference[];
  selectedDuelId: string | null;
  selectedDeckListId: string | null;
  isBusy: boolean;
  onBackToOpponents: () => void;
  onSelectDuel: (duelId: string) => void;
}

export function AdminStoryDuelCatalog({
  duels,
  selectedDuelId,
  selectedDeckListId,
  isBusy,
  onBackToOpponents,
  onSelectDuel,
}: IAdminStoryDuelCatalogProps) {
  return (
    <section className="flex h-full min-h-0 w-72 shrink-0 flex-col rounded-2xl border border-cyan-500/35 bg-[linear-gradient(160deg,rgba(7,20,34,0.92),rgba(3,11,20,0.96))] p-3 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
      <div className="mb-3 flex items-center justify-between gap-2 border-b border-cyan-800/60 pb-2">
        <button
          type="button"
          aria-label="Volver al catálogo de oponentes Story"
          className="h-8 rounded-md border border-cyan-700/70 bg-slate-950/70 px-2 text-xs font-bold uppercase tracking-[0.12em] text-cyan-100"
          disabled={isBusy}
          onClick={onBackToOpponents}
        >
          ← Volver
        </button>
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-200">Duelos Story</p>
      </div>
      <div className="home-modern-scroll min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {duels.map((duel) => {
          const isSelected = duel.duelId === selectedDuelId;
          const isDeckBound = duel.deckListId === selectedDeckListId;
          return (
            <button
              key={duel.duelId}
              type="button"
              aria-label={`Seleccionar duelo ${duel.title}`}
              disabled={isBusy}
              onClick={() => void onSelectDuel(duel.duelId)}
              className={`w-full rounded-lg border px-3 py-2 text-left transition ${isSelected ? "border-cyan-300 bg-cyan-500/20 text-cyan-100" : "border-slate-700 bg-slate-950/65 text-slate-100 hover:border-cyan-600"}`}
            >
              <p className="text-xs font-black uppercase tracking-[0.14em]">{`Ch${duel.chapter}-${duel.duelIndex}`}</p>
              <p className="mt-1 truncate text-xs">{duel.title}</p>
              <p className="mt-1 text-[11px] text-slate-300">{isDeckBound ? "Deck activo" : `Deck: ${duel.deckListId}`}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
