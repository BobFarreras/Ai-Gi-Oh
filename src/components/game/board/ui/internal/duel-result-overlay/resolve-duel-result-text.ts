// src/components/game/board/ui/internal/duel-result-overlay/resolve-duel-result-text.ts - Resuelve el titular final mostrado en el overlay del resultado.
import { IPlayer } from "@/core/entities/IPlayer";

/**
 * Traduce el ganador del duelo a un titular legible para el overlay final.
 */
export function resolveDuelResultText(winnerPlayerId: string | "DRAW" | null, playerA: IPlayer, playerB: IPlayer): string {
  if (!winnerPlayerId) return "";
  if (winnerPlayerId === "DRAW") return "EMPATE";
  if (winnerPlayerId === playerA.id) return `VICTORIA DE ${playerA.name}`;
  if (winnerPlayerId === playerB.id) return `DERROTA - GANA ${playerB.name}`;
  return "FIN DEL DUELO";
}
