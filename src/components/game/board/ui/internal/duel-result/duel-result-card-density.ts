// src/components/game/board/ui/internal/duel-result/duel-result-card-density.ts - Resuelve densidad visual de cartas del overlay final según cantidad total.
export type DuelResultCardDensity = "compact" | "medium" | "large";

export function resolveDuelResultCardDensity(cardCount: number): DuelResultCardDensity {
  if (cardCount >= 9) return "compact";
  if (cardCount >= 6) return "medium";
  return "large";
}

