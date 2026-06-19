// src/components/admin/internal/AdminStoryDuelCatalog.tsx - Catálogo lateral de duelos Story por oponente con selector rápido y navegación de retorno.
"use client";

import { IAdminStoryDuelReference } from "@/core/entities/admin/IAdminStoryDeck";

interface IAdminStoryDuelCatalogProps {
  duels: IAdminStoryDuelReference[];
  selectedDuelId: string | null;
  selectedDeckListId: string | null;
  selectedOpponentName: string | null;
  isBusy: boolean;
  onBackToOpponents: () => void;
  onSelectDuel: (duelId: string) => void;
}

export function AdminStoryDuelCatalog({
  duels,
  selectedDuelId,
  selectedDeckListId,
  selectedOpponentName,
  isBusy,
  onBackToOpponents,
  onSelectDuel,
}: IAdminStoryDuelCatalogProps) {
  const totalDuels = duels.length;

  return (
    <section className="flex h-full min-h-0 w-72 shrink-0 flex-col rounded-2xl border border-cyan-500/35 bg-[linear-gradient(165deg,rgba(7,20,34,0.93),rgba(3,11,20,0.97))] p-2.5 shadow-[0_0_20px_rgba(6,182,212,0.18)]">
      <div className="mb-2 border-b border-cyan-900/50 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Volver al catálogo de oponentes Story"
            className="flex h-7 items-center gap-1.5 rounded-md border border-cyan-700/60 bg-slate-950/70 px-2.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300 transition hover:border-cyan-500 hover:bg-slate-900/70"
            disabled={isBusy}
            onClick={onBackToOpponents}
          >
            <svg viewBox="0 0 24 24" className="h-3 w-3 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
            Oponentes
          </button>
          <span className="ml-auto rounded border border-cyan-900/50 bg-slate-950/50 px-2 py-0.5 text-[9px] font-bold text-cyan-500">
            {totalDuels}
          </span>
        </div>
        {selectedOpponentName && (
          <p className="mt-1.5 truncate text-[11px] font-black uppercase tracking-wide text-cyan-200">
            {selectedOpponentName}
          </p>
        )}
      </div>
      <div className="home-modern-scroll min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
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
              className={`group w-full rounded-xl border px-3 py-2 text-left transition ${isSelected ? "border-cyan-400/60 bg-[linear-gradient(120deg,rgba(34,211,238,0.1),rgba(6,182,212,0.05))] shadow-[0_0_10px_rgba(34,211,238,0.1)]" : "border-slate-700/50 bg-slate-950/50 hover:border-cyan-700/50 hover:bg-slate-900/60"}`}
            >
              <div className="flex items-start justify-between gap-1">
                <p className={`text-[10px] font-black uppercase tracking-[0.16em] ${isSelected ? "text-cyan-300" : "text-slate-400 group-hover:text-cyan-400"}`}>
                  {`Ch${duel.chapter}-${duel.duelIndex}`}
                </p>
                {isDeckBound && (
                  <span className="mt-0.5 rounded border border-emerald-600/50 bg-emerald-950/50 px-1.5 py-0.5 text-[8px] font-bold uppercase text-emerald-400">
                    Activo
                  </span>
                )}
              </div>
              <p className={`mt-0.5 truncate text-xs font-semibold ${isSelected ? "text-slate-100" : "text-slate-300"}`}>
                {duel.title}
              </p>
              {!isDeckBound && (
                <p className="mt-0.5 truncate text-[10px] text-slate-500">
                  {duel.deckListId}
                </p>
              )}
            </button>
          );
        })}
        {duels.length === 0 && (
          <p className="mt-4 text-center text-xs text-slate-500">Sin duelos disponibles</p>
        )}
      </div>
    </section>
  );
}
