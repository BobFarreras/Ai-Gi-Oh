// src/components/hub/academy/training/modes/olympus/internal/OlympusLegendSelector.tsx - Elige la leyenda y muestra sus reglas y recompensas antes de gastar intento.
"use client";
import Image from "next/image";
import { IOlympusLegend } from "@/core/entities/olympus/IOlympus";

interface IOlympusLegendSelectorProps {
  legends: IOlympusLegend[];
  defeatedLegendIds: string[];
  selectedId: string | null;
  onSelect: (opponentId: string) => void;
}

/**
 * Las reglas especiales y la recompensa se enseñan ANTES de confirmar: el jugador nunca gasta un intento
 * sin saber contra qué se mete ni qué gana.
 */
export function OlympusLegendSelector({ legends, defeatedLegendIds, selectedId, onSelect }: IOlympusLegendSelectorProps) {
  return (
    <section aria-labelledby="olympus-legends-title">
      <h2 id="olympus-legends-title" className="mb-2 text-[11px] font-black uppercase tracking-[0.28em] text-violet-300/80">
        Tu rival legendario
      </h2>
      <ul className="home-modern-scroll flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-visible">
        {legends.map((legend) => {
          const isSelected = legend.id === selectedId;
          const isDefeated = defeatedLegendIds.includes(legend.id);
          return (
            <li key={legend.id} className="w-[248px] shrink-0 snap-start md:w-auto">
              <button
                type="button"
                aria-pressed={isSelected}
                aria-label={`Elegir a ${legend.displayName}`}
                onClick={() => onSelect(legend.id)}
                className={`group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border text-left transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 ${
                  isSelected
                    ? "border-amber-300/70 shadow-[0_0_28px_rgba(168,85,247,0.32)]"
                    : "border-violet-800/50 hover:border-violet-500/60"
                }`}
              >
                <span className="relative block h-36 w-full overflow-hidden bg-[#0d0616]">
                  {legend.avatarPath ? (
                    <Image src={legend.avatarPath} alt="" fill sizes="260px" unoptimized
                      className={`object-cover object-top transition-transform duration-300 ${isSelected ? "scale-105" : "group-hover:scale-105"}`} />
                  ) : null}
                  <span className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgba(13,6,22,0.95))]" />
                  {isDefeated ? (
                    <span className="absolute right-2 top-2 rounded-full border border-emerald-400/60 bg-emerald-950/85 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-300">
                      Vencida
                    </span>
                  ) : (
                    <span className="absolute right-2 top-2 rounded-full border border-amber-300/60 bg-amber-950/85 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-200">
                      +{legend.firstVictoryFragmentBonus} 1ª victoria
                    </span>
                  )}
                  <span className="absolute inset-x-3 bottom-2">
                    <span className="block text-xl font-black uppercase italic tracking-tight text-amber-50">{legend.displayName}</span>
                    <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300/90">{legend.aiProfile}</span>
                  </span>
                </span>

                <span className="flex flex-1 flex-col gap-2 bg-[#120a1e]/90 p-3">
                  {legend.lore ? <span className="block text-[11px] leading-snug text-slate-400">{legend.lore}</span> : null}
                  {legend.specialRules.length > 0 ? (
                    <ul className="space-y-1">
                      {legend.specialRules.map((rule) => (
                        <li key={rule} className="flex gap-1.5 text-[10.5px] leading-snug text-violet-200/90">
                          <span aria-hidden className="text-amber-400">◆</span>
                          {rule}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <span className="mt-auto flex items-center gap-2 border-t border-violet-900/60 pt-2 text-[10px] font-bold uppercase tracking-wider">
                    <span className="text-amber-300">{legend.baseFragmentReward} de Éter</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-500">Derrota: {legend.defeatFragmentReward}</span>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
