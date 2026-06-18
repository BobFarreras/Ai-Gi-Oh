// src/components/hub/ranking/internal/ranking-equality.ts - Comparadores puros por contenido para memoización de filas y podio del ranking.
import { IRankingEntry } from "@/services/ranking/get-ranking-data";

/**
 * Compara dos entradas del ranking por los campos que afectan al render de la
 * fila. El servidor puede servir snapshots nuevos con refs distintas; este
 * comparador evita re-renders cuando el contenido no cambió.
 */
export function areEqualRankingRowProps(
  prev: { entry: IRankingEntry; isLocal: boolean },
  next: { entry: IRankingEntry; isLocal: boolean },
): boolean {
  if (
    prev.isLocal !== next.isLocal ||
    prev.entry.rank !== next.entry.rank ||
    prev.entry.playerId !== next.entry.playerId ||
    prev.entry.nickname !== next.entry.nickname ||
    prev.entry.avatarUrl !== next.entry.avatarUrl ||
    prev.entry.eloRating !== next.entry.eloRating ||
    prev.entry.wins !== next.entry.wins ||
    prev.entry.losses !== next.entry.losses
  ) {
    return false;
  }

  // Comparar recentForm por contenido (máx 5 elementos, comparación barata)
  const prevForm = prev.entry.recentForm;
  const nextForm = next.entry.recentForm;
  if (prevForm.length !== nextForm.length) return false;
  for (let i = 0; i < prevForm.length; i++) {
    if (prevForm[i] !== nextForm[i]) return false;
  }
  return true;
}
