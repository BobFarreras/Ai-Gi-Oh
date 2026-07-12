// src/components/hub/ranking/RankingClient.tsx - Orquestador cliente del ranking: header + buscador + lista única de clasificación.
"use client";

import Link from "next/link";
import { CalendarClock } from "lucide-react";
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
      {/* Acceso a los rankings semanales (actividad + comercial) con premios los domingos */}
      <Link
        href="/hub/ranking/weekly"
        className="flex items-center justify-center gap-2 rounded-lg border border-violet-500/40 bg-violet-950/25 px-3 py-2 text-xs font-black uppercase tracking-widest text-violet-200 transition hover:border-violet-300/70 hover:bg-violet-900/40"
      >
        <CalendarClock size={15} className="shrink-0" />
        Rankings semanales · premios los domingos
      </Link>
      {/* Buscador de duelistas */}
      <UserSearchInput value={query} onChange={setQuery} placeholder="Buscar duelista en el ranking…" />
      <RankingList entries={filtered} localPlayerId={localPlayerId} />
    </div>
  );
}
