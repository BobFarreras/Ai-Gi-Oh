// src/components/hub/academy/training/modes/olympus/internal/OlympusChampionSelector.tsx - Elige qué campeón derrotado presta su mazo.
"use client";
import Image from "next/image";
import { Layers, Lock } from "lucide-react";
import { IOlympusChampionCard } from "../olympus-api-client";

interface IOlympusChampionSelectorProps {
  champions: IOlympusChampionCard[];
  selectedId: string | null;
  onSelect: (championId: string) => void;
  onInspectDeck: (championId: string) => void;
}

/**
 * Sin marcos ni tarjetas: el campeón ES su retrato, recortado a sangre. La selección se lee por el
 * color y la barra inferior, no por un borde, para que la ilustración mande.
 */
export function OlympusChampionSelector({ champions, selectedId, onSelect, onInspectDeck }: IOlympusChampionSelectorProps) {
  const selected = champions.find((state) => state.champion.id === selectedId) ?? null;

  return (
    <section aria-labelledby="olympus-champions-title">
      <div className="mb-1.5 flex items-center gap-2">
        <h2 id="olympus-champions-title" className="font-display text-[11px] font-black uppercase tracking-[0.28em] text-amber-300/80">
          Tu campeón
        </h2>
        {selected?.unlocked ? (
          <button
            type="button"
            aria-label={`Ver el mazo prestado de ${selected.displayName}`}
            onClick={() => onInspectDeck(selected.champion.id)}
            className="ml-auto flex min-h-9 items-center gap-1.5 rounded-lg border border-cyan-400/50 bg-cyan-950/30 px-2.5 font-display text-[10px] font-black uppercase tracking-wider text-cyan-200 transition hover:bg-cyan-900/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
          >
            <Layers aria-hidden size={13} />
            Ver mazo
          </button>
        ) : null}
      </div>

      {/* Carrusel nativo con scroll-snap; en escritorio se reparte en fila. */}
      <ul className="home-modern-scroll flex snap-x snap-mandatory gap-1 overflow-x-auto pb-1 md:grid md:grid-cols-4 md:gap-2 md:overflow-visible">
        {champions.map((state) => {
          const isSelected = state.champion.id === selectedId;
          const portrait = state.introUrl ?? state.avatarUrl;
          const rankSum = Object.values(state.progress?.nodeRanks ?? {}).reduce((total, rank) => total + rank, 0);
          return (
            <li key={state.champion.id} className="w-[112px] shrink-0 snap-start md:w-auto">
              <button
                type="button"
                disabled={!state.unlocked}
                aria-pressed={isSelected}
                aria-label={state.unlocked
                  ? `Elegir a ${state.displayName}`
                  : `${state.displayName} bloqueado: derrótalo en el nivel ${state.champion.requiredTier}`}
                onClick={() => onSelect(state.champion.id)}
                className={`group relative block aspect-[3/4] w-full overflow-hidden rounded-lg text-left transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 ${
                  !state.unlocked ? "cursor-not-allowed" : isSelected ? "scale-[1.02]" : "hover:brightness-110"
                }`}
              >
                {portrait ? (
                  <Image
                    src={portrait}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 220px, 112px"
                    unoptimized
                    className={`object-cover object-top transition-all duration-500 ${
                      !state.unlocked
                        ? "grayscale brightness-[0.35]"
                        : isSelected
                          ? "scale-105 saturate-125"
                          : "brightness-[0.62] saturate-50 group-hover:brightness-90"
                    }`}
                  />
                ) : (
                  <span aria-hidden className="absolute inset-0 bg-[#160d24]" />
                )}
                {/* Degradado hacia el fondo de la página: el retrato se funde en vez de recortarse. */}
                <span aria-hidden className="absolute inset-x-0 bottom-0 h-3/5 bg-[linear-gradient(180deg,transparent,rgba(10,5,19,0.55)_45%,#0a0513)]" />
                {isSelected ? (
                  <span aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_50%_115%,rgba(251,191,36,0.35),transparent_60%)]" />
                ) : null}

                <span className="absolute inset-x-1.5 bottom-1.5">
                  <span className={`block truncate font-display text-[13px] font-black uppercase italic leading-tight ${
                    isSelected ? "text-amber-100" : state.unlocked ? "text-slate-300" : "text-slate-500"
                  }`}>
                    {state.displayName}
                  </span>
                  {state.unlocked ? (
                    <span className="mt-0.5 block truncate text-[9.5px] font-bold uppercase tracking-wider text-violet-300/80">
                      {rankSum > 0 ? `${rankSum} rango${rankSum === 1 ? "" : "s"}` : "Sin mejoras"}
                    </span>
                  ) : (
                    <span className="mt-0.5 flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
                      <Lock aria-hidden size={10} />
                      Nivel {state.champion.requiredTier}
                    </span>
                  )}
                  {/* La barra sustituye al borde: marca la selección sin encajonar la ilustración. */}
                  <span
                    aria-hidden
                    className={`mt-1 block h-[3px] rounded-full transition-all duration-300 ${
                      isSelected ? "bg-[linear-gradient(90deg,#fde68a,#c084fc)] opacity-100" : "bg-slate-600 opacity-0"
                    }`}
                  />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
