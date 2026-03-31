// src/components/admin/internal/AdminStoryOpponentCatalog.tsx - Catálogo lateral de oponentes Story con avatar, dificultad y contadores de contenido.
"use client";

import Image from "next/image";
import { useState } from "react";
import { IAdminStoryOpponentSummary } from "@/core/entities/admin/IAdminStoryDeck";

interface IAdminStoryOpponentCatalogProps {
  opponents: IAdminStoryOpponentSummary[];
  selectedOpponentId: string | null;
  onSelectOpponent: (opponentId: string) => void;
}

export function AdminStoryOpponentCatalog({ opponents, selectedOpponentId, onSelectOpponent }: IAdminStoryOpponentCatalogProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <section className={`${isExpanded ? "w-72" : "w-16"} flex h-full min-h-0 shrink-0 flex-col rounded-2xl border border-cyan-800/35 bg-[#031020]/50 p-2 transition-all`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        {isExpanded ? <h2 className="text-sm font-black uppercase tracking-[0.2em] text-cyan-200">Oponentes Story</h2> : null}
        <button
          type="button"
          aria-label={isExpanded ? "Plegar catálogo de oponentes" : "Desplegar catálogo de oponentes"}
          className="h-8 rounded-md border border-slate-600 px-2 text-xs font-bold uppercase text-slate-100"
          onClick={() => setIsExpanded((current) => !current)}
        >
          {isExpanded ? "<<" : ">>"}
        </button>
      </div>
      <div className="home-modern-scroll min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {isExpanded
          ? opponents.map((opponent) => (
            <button
              key={opponent.opponentId}
              type="button"
              aria-label={`Seleccionar oponente ${opponent.displayName}`}
              className={`w-full rounded-md border p-2 text-left ${selectedOpponentId === opponent.opponentId ? "border-cyan-300 bg-cyan-500/20 text-cyan-100" : "border-slate-600 bg-slate-900/70 text-slate-100 hover:border-cyan-500"}`}
              onClick={() => onSelectOpponent(opponent.opponentId)}
            >
              <div className="flex items-center gap-2">
                <div className="relative h-10 w-10 overflow-hidden rounded-md border border-slate-600 bg-slate-800">
                  {opponent.avatarUrl ? <Image src={opponent.avatarUrl} alt={opponent.displayName} fill className="object-cover" sizes="40px" /> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold uppercase">{opponent.displayName}</p>
                  <p className="text-[11px] text-slate-300">Dificultad: {opponent.difficulty}</p>
                  <p className="text-[11px] text-slate-400">Decks: {opponent.deckCount} · Duelos: {opponent.duelCount}</p>
                </div>
              </div>
            </button>
          ))
          : opponents.map((opponent) => (
            <button
              key={opponent.opponentId}
              type="button"
              aria-label={`Seleccionar oponente ${opponent.displayName}`}
              className={`flex w-full items-center justify-center rounded-md border p-1 ${selectedOpponentId === opponent.opponentId ? "border-cyan-300 bg-cyan-500/20" : "border-slate-600 bg-slate-900/70 hover:border-cyan-500"}`}
              onClick={() => onSelectOpponent(opponent.opponentId)}
            >
              <div className="relative h-10 w-10 overflow-hidden rounded-md border border-slate-600 bg-slate-800">
                {opponent.avatarUrl ? <Image src={opponent.avatarUrl} alt={opponent.displayName} fill className="object-cover" sizes="40px" /> : null}
              </div>
            </button>
          ))}
      </div>
    </section>
  );
}
