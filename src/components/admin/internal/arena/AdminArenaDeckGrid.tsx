// src/components/admin/internal/arena/AdminArenaDeckGrid.tsx - Grid visual del mazo de una variante de arena (deck + fusión) con miniaturas reales.
"use client";

import { ICard } from "@/core/entities/ICard";
import { IAdminArenaCardEntry } from "@/core/entities/training/IAdminArena";
import { HomeMiniCard } from "@/components/hub/home/HomeMiniCard";
import { ArenaDeckZone } from "@/components/admin/internal/arena/use-admin-arena-deck-editor";

interface IAdminArenaDeckGridProps {
  deck: IAdminArenaCardEntry[];
  fusion: IAdminArenaCardEntry[];
  cardById: Map<string, ICard>;
  isEditMode: boolean;
  selectedRef: { zone: ArenaDeckZone; index: number } | null;
  onSelect: (zone: ArenaDeckZone, index: number) => void;
  onRemove: (zone: ArenaDeckZone, index: number) => void;
}

function ZoneGrid({ zone, entries, ...props }: IAdminArenaDeckGridProps & { zone: ArenaDeckZone; entries: IAdminArenaCardEntry[] }) {
  if (entries.length === 0) {
    return <p className="col-span-full py-4 text-center text-[11px] text-slate-500">Sin cartas. Selecciona una del almacén y pulsa «Añadir».</p>;
  }
  return (
    <>
      {entries.map((entry, index) => {
        const isSelected = props.selectedRef?.zone === zone && props.selectedRef.index === index;
        return (
          <div key={`${zone}-${index}-${entry.cardId}`} className="relative w-[72px]">
            <HomeMiniCard
              card={props.cardById.get(entry.cardId) ?? null}
              label={`Carta ${entry.cardId}`}
              isSelected={isSelected}
              versionTier={entry.versionTier ?? 0}
              level={entry.level ?? 0}
              xp={entry.xp ?? 0}
              onClick={() => props.onSelect(zone, index)}
              showSlotContainer={false}
            />
            {props.isEditMode ? (
              <button
                type="button"
                aria-label={`Quitar ${entry.cardId} del mazo`}
                onClick={() => props.onRemove(zone, index)}
                className="absolute -right-1.5 -top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-rose-400/70 bg-rose-950 text-[11px] font-black text-rose-200 hover:bg-rose-800"
              >
                ✕
              </button>
            ) : null}
          </div>
        );
      })}
    </>
  );
}

/** Muestra el mazo (deck principal + fusión) de la variante seleccionada como cuadrícula de cartas. */
export function AdminArenaDeckGrid(props: IAdminArenaDeckGridProps) {
  return (
    <section className="home-modern-scroll flex h-full min-h-0 flex-col gap-3 overflow-y-auto rounded-2xl border border-cyan-800/30 bg-[#031020]/55 p-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-black uppercase tracking-[0.18em] text-cyan-200">Mazo principal</h2>
        <span className="rounded border border-cyan-900/50 bg-slate-950/60 px-2 py-0.5 text-[10px] font-bold text-cyan-500">{props.deck.length}</span>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] justify-items-center gap-2.5">
        <ZoneGrid {...props} zone="DECK" entries={props.deck} />
      </div>
      <div className="mt-1 flex items-center justify-between border-t border-cyan-900/40 pt-2">
        <h2 className="text-sm font-black uppercase tracking-[0.18em] text-violet-300">Fusión</h2>
        <span className="rounded border border-violet-900/50 bg-slate-950/60 px-2 py-0.5 text-[10px] font-bold text-violet-400">{props.fusion.length}</span>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] justify-items-center gap-2.5">
        <ZoneGrid {...props} zone="FUSION" entries={props.fusion} />
      </div>
    </section>
  );
}
