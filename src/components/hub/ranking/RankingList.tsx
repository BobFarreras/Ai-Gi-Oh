// src/components/hub/ranking/RankingList.tsx - Lista única de clasificación: top 3 con fila destacada + resto con fila compacta.
"use client";

import { AnimatePresence } from "framer-motion";
import { IRankingEntry } from "@/services/ranking/get-ranking-data";
import { RankingRow } from "./RankingRow";
import { RankingTopRow } from "./RankingTopRow";

interface RankingListProps {
  entries: IRankingEntry[];
  localPlayerId: string | null;
}

/** Cabecera de columnas compartida (mismo grid que RankingTopRow y RankingRow). */
function ListHeader() {
  return (
    <div className="grid grid-cols-[3.5rem_3.5rem_1fr_5rem_4.5rem_4rem] items-center gap-2 border-b border-slate-700/60 px-3 pb-2">
      <span className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">#</span>
      <span />
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Duelista</span>
      <span className="text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">ELO</span>
      <span className="text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">V/D</span>
      <span className="text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">%</span>
    </div>
  );
}

/**
 * Lista única de clasificación. Las posiciones 1-3 usan RankingTopRow (fila
 * destacada con medalla, glow y estilo por tier); a partir de la 4 usan
 * RankingRow (compacta). Todo en el mismo contenedor scrollable para dar
 * sensación de lista continua, con el top 3 personalizado y punteado.
 */
export function RankingList({ entries, localPlayerId }: RankingListProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-8 text-center">
        <div>
          <p className="text-sm text-slate-400">Aún no hay duelistas clasificados.</p>
          <p className="mt-1 text-xs text-slate-500">Completa una partida multijugador para aparecer aquí.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-slate-700/50 bg-slate-900/30 p-2">
      <ListHeader />
      <div className="home-modern-scroll min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="flex flex-col gap-1.5 pt-2">
          <AnimatePresence mode="popLayout">
            {entries.map((entry) =>
              entry.rank <= 3 ? (
                <RankingTopRow
                  key={entry.playerId}
                  entry={entry}
                  isLocal={entry.playerId === localPlayerId}
                />
              ) : (
                <RankingRow
                  key={entry.playerId}
                  entry={entry}
                  isLocal={entry.playerId === localPlayerId}
                />
              ),
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
