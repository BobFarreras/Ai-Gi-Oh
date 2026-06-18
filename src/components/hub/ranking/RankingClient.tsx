// src/components/hub/ranking/RankingClient.tsx - Orquestador cliente del ranking: header + buscador + lista única de clasificación.
"use client";

import { IRankingEntry } from "@/services/ranking/get-ranking-data";
import { useFilteredPlayers } from "@/components/hub/internal/use-filtered-players";
import { UserSearchInput } from "@/components/hub/internal/UserSearchInput";
import { RankingHeaderBar } from "./layout/RankingHeaderBar";
import { RankingList } from "./RankingList";

interface RankingClientProps {
  entries: IRankingEntry[];
  localPlayerId: string | null;
  localPlayerRank: number | null;
}

/**
 * Orquesta la composición del ranking: cabecera con stats globales, buscador
 * de duelistas y una única lista de clasificación donde el top 3 recibe fila
 * destacada. Sin estado de realtime (los datos vienen del servidor en cada
 * navegación).
 */
export function RankingClient({ entries, localPlayerId, localPlayerRank }: RankingClientProps) {
  // ELO del jugador local para mostrar en la cabecera (evita tener que buscarse en la lista).
  const localPlayerEntry = localPlayerId ? entries.find((e) => e.playerId === localPlayerId) : null;
  const localPlayerElo = localPlayerEntry?.eloRating ?? null;

  // Buscador: filtra la lista de clasificación por nickname.
  const { query, setQuery, filtered } = useFilteredPlayers(entries);

  return (
    <div className="flex h-full flex-col gap-3">
      <RankingHeaderBar
        totalDuelists={entries.length}
        localPlayerElo={localPlayerElo}
        localPlayerRank={localPlayerRank}
      />
      {/* Buscador de duelistas */}
      <UserSearchInput value={query} onChange={setQuery} placeholder="Buscar duelista en el ranking…" />
      <RankingList entries={filtered} localPlayerId={localPlayerId} />
    </div>
  );
}
