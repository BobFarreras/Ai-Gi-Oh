// src/components/hub/ranking/RankingList.tsx - Lista scrollable del ranking (rank 4+) con cabecera y fila local destacada.
"use client";

import { AnimatePresence } from "framer-motion";
import { IRankingEntry } from "@/services/ranking/get-ranking-data";
import { RankingRow } from "./RankingRow";

interface RankingListProps {
  entries: IRankingEntry[];
  localPlayerId: string | null;
}

/** Cabecera de columnas de la lista (labels compactos). */
function ListHeader() {
  return (
    <div className="grid grid-cols-[2.5rem_2.25rem_1fr_4rem_3.5rem_3rem] items-center gap-2 border-b border-slate-700/60 px-3 pb-2">
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
 * Lista del ranking a partir del puesto 4. Scrollable con scrollbar cian. La
 * fila del jugador local se destaca con ring cian (gestionado por RankingRow).
 */
export function RankingList({ entries, localPlayerId }: RankingListProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-8 text-center">
        <p className="text-sm text-slate-400">No hay más duelistas clasificados.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-slate-700/50 bg-slate-900/30 p-2">
      <ListHeader />
      <div className="home-modern-scroll min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="flex flex-col gap-1 pt-1">
          <AnimatePresence mode="popLayout">
            {entries.map((entry) => (
              <RankingRow
                key={entry.playerId}
                entry={entry}
                isLocal={entry.playerId === localPlayerId}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
