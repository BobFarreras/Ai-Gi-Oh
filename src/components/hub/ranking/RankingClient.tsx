// src/components/hub/ranking/RankingClient.tsx - Orquestador cliente del ranking: header + lista única de clasificación.
"use client";

import { IRankingEntry } from "@/services/ranking/get-ranking-data";
import { RankingHeaderBar } from "./layout/RankingHeaderBar";
import { RankingList } from "./RankingList";

interface RankingClientProps {
  entries: IRankingEntry[];
  localPlayerId: string | null;
  localPlayerRank: number | null;
}

/**
 * Orquesta la composición del ranking: cabecera con stats globales y una
 * única lista de clasificación donde el top 3 recibe fila destacada. Sin
 * estado de realtime (los datos vienen del servidor en cada navegación).
 */
export function RankingClient({ entries, localPlayerId, localPlayerRank }: RankingClientProps) {
  const topElo = entries.length > 0 ? entries[0].eloRating : null;

  return (
    <div className="flex h-full flex-col gap-3">
      <RankingHeaderBar
        totalDuelists={entries.length}
        topElo={topElo}
        localPlayerRank={localPlayerRank}
      />
      <RankingList entries={entries} localPlayerId={localPlayerId} />
    </div>
  );
}
