// src/components/hub/internal/use-filtered-players.ts - Hook compartido para filtrar listas de usuarios por nickname con estado de búsqueda.
"use client";

import { useMemo, useState } from "react";

/**
 * Encapsula el estado de búsqueda + filtrado por nickname de una lista de
 * usuarios. Reutilizable entre multiplayer (jugadores online) y ranking
 * (clasificación). La comparación es case-insensitive sobre el nickname.
 *
 * @param players Lista completa de usuarios con campo `nickname`.
 * @returns query actual, setter del query y lista filtrada.
 */
export function useFilteredPlayers<T extends { nickname: string }>(players: T[]) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return players;
    return players.filter((p) => p.nickname.toLowerCase().includes(trimmed));
  }, [players, query]);

  return { query, setQuery, filtered };
}
