// src/core/use-cases/game-engine/state/mulligan-opening-hand.ts - Rebaraje de la mano de apertura (ficha 8,
// habilidad OPENING_MULLIGAN, solo PvE). Devuelve la mano del jugador al mazo, rebaraja SOLO su mazo y reparte
// una mano nueva del MISMO tamaño. No toca al rival ni ningún otro estado (LP/energía/turno intactos). Función
// pura; el llamador decide cuándo y cuántas veces (la habilidad da 1 uso, gestionado en la UI/board).
import { ICard } from "@/core/entities/ICard";
import { RandomSource } from "@/core/services/random/seeded-rng";
import { GameState } from "./types";

/** Baraja una copia del array con Fisher-Yates usando la fuente aleatoria dada (determinista por seed). */
function shuffle<T>(items: readonly T[], randomSource: RandomSource): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(randomSource() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Rehace la mano de apertura del jugador `playerId`: junta mano+mazo, rebaraja y reparte `hand.length` cartas
 * nuevas (mismo tamaño de mano). Si el jugador no tiene mano (nada que rebarajar), devuelve el estado sin cambios.
 */
export function mulliganOpeningHand(state: GameState, playerId: string, randomSource: RandomSource): GameState {
  const isPlayerA = state.playerA.id === playerId;
  const isPlayerB = state.playerB.id === playerId;
  if (!isPlayerA && !isPlayerB) return state;

  const player = isPlayerA ? state.playerA : state.playerB;
  const handSize = player.hand.length;
  if (handSize === 0) return state;

  const reshuffled: ICard[] = shuffle([...player.hand, ...player.deck], randomSource);
  const nextPlayer = { ...player, hand: reshuffled.slice(0, handSize), deck: reshuffled.slice(handSize) };

  return isPlayerA ? { ...state, playerA: nextPlayer } : { ...state, playerB: nextPlayer };
}
