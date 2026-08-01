// src/components/hub/academy/training/modes/olympus/internal/OlympusChampionSelector.tsx - Elige qué campeón derrotado presta su mazo.
"use client";
import Image from "next/image";
import { IOlympusChampionCard } from "../olympus-api-client";

interface IOlympusChampionSelectorProps {
  champions: IOlympusChampionCard[];
  selectedId: string | null;
  onSelect: (championId: string) => void;
}

/**
 * Los bloqueados se muestran igualmente, apagados y con el requisito visible: saber qué falta por
 * conseguir es la mitad de la motivación del modo.
 */
export function OlympusChampionSelector({ champions, selectedId, onSelect }: IOlympusChampionSelectorProps) {
  return (
    <section aria-labelledby="olympus-champions-title">
      <h2 id="olympus-champions-title" className="mb-2 text-[11px] font-black uppercase tracking-[0.28em] text-amber-300/80">
        Tu campeón
      </h2>
      {/* Carrusel nativo en móvil con scroll-snap; rejilla en pantallas anchas. */}
      <ul className="home-modern-scroll flex snap-x snap-mandatory gap-2 overflow-x-auto pb-2 md:grid md:grid-cols-4 md:overflow-visible xl:grid-cols-4">
        {champions.map((state) => {
          const isSelected = state.champion.id === selectedId;
          const nodeCount = state.progress?.unlockedNodeIds.length ?? 0;
          return (
            <li key={state.champion.id} className="w-[148px] shrink-0 snap-start md:w-auto">
              <button
                type="button"
                disabled={!state.unlocked}
                aria-pressed={isSelected}
                aria-label={state.unlocked
                  ? `Elegir a ${state.displayName}`
                  : `${state.displayName} bloqueado: derrótalo en el nivel ${state.champion.requiredTier}`}
                onClick={() => onSelect(state.champion.id)}
                className={`group relative flex h-full min-h-[112px] w-full flex-col justify-end overflow-hidden rounded-xl border p-2.5 text-left transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 ${
                  !state.unlocked
                    ? "cursor-not-allowed border-slate-800/70 bg-slate-950/80 opacity-60"
                    : isSelected
                      ? "border-amber-300/70 bg-[linear-gradient(150deg,rgba(251,191,36,0.18),rgba(168,85,247,0.16))] shadow-[0_0_20px_rgba(251,191,36,0.25)]"
                      : "border-violet-800/50 bg-[#120a1e]/80 hover:border-amber-400/50"
                }`}
              >
                {state.avatarUrl ? (
                  <Image src={state.avatarUrl} alt="" fill sizes="160px" unoptimized
                    className={`object-cover object-top transition-opacity ${state.unlocked ? "opacity-35 group-hover:opacity-50" : "opacity-15 grayscale"}`} />
                ) : null}
                <span className="relative">
                  <span className="block truncate text-sm font-black uppercase tracking-wide text-amber-50">{state.displayName}</span>
                  {state.unlocked ? (
                    <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-wider text-violet-300/80">
                      {nodeCount > 0 ? `${nodeCount} mejora${nodeCount === 1 ? "" : "s"}` : "Sin mejoras"}
                    </span>
                  ) : (
                    <span className="mt-0.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <svg viewBox="0 0 24 24" className="h-3 w-3 fill-none stroke-current" strokeWidth="2.4">
                        <rect x="5" y="11" width="14" height="10" rx="2" />
                        <path d="M8 11V7a4 4 0 018 0v4" strokeLinecap="round" />
                      </svg>
                      Nivel {state.champion.requiredTier}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
