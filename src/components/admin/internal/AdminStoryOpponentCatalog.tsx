// src/components/admin/internal/AdminStoryOpponentCatalog.tsx - Catálogo lateral de oponentes Story con avatar, dificultad y contadores de contenido.
"use client";

import Image from "next/image";
import { memo, useState } from "react";
import { IAdminStoryOpponentSummary } from "@/core/entities/admin/IAdminStoryDeck";

const DIFFICULTY_COLORS: Record<string, string> = {
  ROOKIE: "text-emerald-400 border-emerald-700/50",
  STANDARD: "text-cyan-400 border-cyan-700/50",
  ELITE: "text-amber-400 border-amber-700/50",
  BOSS: "text-rose-400 border-rose-700/50",
  MYTHIC: "text-violet-400 border-violet-700/50",
};

interface IAdminStoryOpponentCatalogProps {
  opponents: IAdminStoryOpponentSummary[];
  selectedOpponentId: string | null;
  onSelectOpponent: (opponentId: string) => void;
}

function AdminStoryOpponentCatalogComponent({ opponents, selectedOpponentId, onSelectOpponent }: IAdminStoryOpponentCatalogProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <section
      className={`${isExpanded ? "w-72" : "w-14"} flex h-full min-h-0 shrink-0 flex-col rounded-2xl border border-cyan-500/35 bg-[linear-gradient(165deg,rgba(8,22,38,0.93),rgba(3,10,18,0.97))] p-2.5 shadow-[0_0_22px_rgba(6,182,212,0.18)] transition-all duration-200`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        {isExpanded && (
          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.18em] text-cyan-200">Oponentes</h2>
            <p className="text-[10px] text-slate-500">{opponents.length} disponibles</p>
          </div>
        )}
        <button
          type="button"
          aria-label={isExpanded ? "Plegar catálogo de oponentes" : "Desplegar catálogo de oponentes"}
          className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-700/60 bg-slate-950/70 text-cyan-400 transition hover:border-cyan-500 hover:text-cyan-300"
          onClick={() => setIsExpanded((current) => !current)}
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round">
            {isExpanded ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
          </svg>
        </button>
      </div>

      <div className="home-modern-scroll min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-0.5">
        {isExpanded
          ? opponents.map((opponent) => {
              const isSelected = selectedOpponentId === opponent.opponentId;
              const diffColor = DIFFICULTY_COLORS[opponent.difficulty] ?? "text-slate-400 border-slate-700/50";
              return (
                <button
                  key={opponent.opponentId}
                  type="button"
                  aria-label={`Seleccionar oponente ${opponent.displayName}`}
                  className={`group w-full rounded-xl border p-2 text-left transition ${isSelected ? "border-cyan-400/60 bg-[linear-gradient(120deg,rgba(34,211,238,0.1),rgba(6,182,212,0.05))] shadow-[0_0_10px_rgba(34,211,238,0.1)]" : "border-slate-700/50 bg-slate-950/50 hover:border-cyan-700/50 hover:bg-slate-900/60"}`}
                  onClick={() => onSelectOpponent(opponent.opponentId)}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border ${isSelected ? "border-cyan-500/60" : "border-slate-600/60"} bg-slate-800`}>
                      {opponent.avatarUrl
                        ? <Image src={opponent.avatarUrl} alt={opponent.displayName} fill className="object-cover" sizes="44px" />
                        : <span className="flex h-full w-full items-center justify-center text-slate-500">
                            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.5"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
                          </span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-xs font-black uppercase tracking-wide ${isSelected ? "text-cyan-100" : "text-slate-200 group-hover:text-slate-100"}`}>
                        {opponent.displayName}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className={`rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase ${diffColor} bg-black/30`}>
                          {opponent.difficulty}
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] text-slate-500">
                        {opponent.deckCount} decks · {opponent.duelCount} duelos
                      </p>
                    </div>
                    {isSelected && (
                      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-none stroke-cyan-400" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
                    )}
                  </div>
                </button>
              );
            })
          : opponents.map((opponent) => {
              const isSelected = selectedOpponentId === opponent.opponentId;
              return (
                <button
                  key={opponent.opponentId}
                  type="button"
                  aria-label={`Seleccionar oponente ${opponent.displayName}`}
                  className={`flex w-full items-center justify-center rounded-xl border p-1.5 transition ${isSelected ? "border-cyan-400/60 bg-cyan-950/40 shadow-[0_0_8px_rgba(34,211,238,0.1)]" : "border-slate-700/50 bg-slate-950/50 hover:border-cyan-700/50"}`}
                  onClick={() => onSelectOpponent(opponent.opponentId)}
                >
                  <div className={`relative h-10 w-10 overflow-hidden rounded-lg border ${isSelected ? "border-cyan-500/60" : "border-slate-600/60"} bg-slate-800`}>
                    {opponent.avatarUrl
                      ? <Image src={opponent.avatarUrl} alt={opponent.displayName} fill className="object-cover" sizes="40px" />
                      : null}
                  </div>
                </button>
              );
            })}
      </div>
    </section>
  );
}

export const AdminStoryOpponentCatalog = memo(AdminStoryOpponentCatalogComponent);
