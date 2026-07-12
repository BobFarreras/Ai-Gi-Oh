// src/components/game/board/internal/resolve-live-selected-card.ts - Resuelve la carta seleccionada usando el estado vivo del duelo para reflejar buffs/debuffs.
import { ICard } from "@/core/entities/ICard";
import { GameState } from "@/core/use-cases/GameEngine";

function collectAllCards(state: GameState): ICard[] {
  return [
    ...state.playerA.hand,
    ...state.playerB.hand,
    ...state.playerA.deck,
    ...state.playerB.deck,
    ...state.playerA.graveyard,
    ...state.playerB.graveyard,
    ...(state.playerA.destroyedPile ?? []),
    ...(state.playerB.destroyedPile ?? []),
    ...state.playerA.activeEntities.map((entity) => entity.card),
    ...state.playerB.activeEntities.map((entity) => entity.card),
    ...state.playerA.activeExecutions.map((entity) => entity.card),
    ...state.playerB.activeExecutions.map((entity) => entity.card),
  ];
}

/**
 * Busca la versión más actual de una carta seleccionada dentro del estado del duelo
 * (para reflejar stats/buffs vivos). Si no la encuentra por runtimeId o id, devuelve la
 * referencia original. La línea del poder V5 la compone `composeCardPowerDescription` en la UI,
 * evitando duplicar el texto de la pasiva.
 */
export function resolveLiveSelectedCard(selectedCard: ICard | null, state: GameState): ICard | null {
  if (!selectedCard) return null;
  const allCards = collectAllCards(state);
  if (selectedCard.runtimeId) {
    const byRuntimeId = allCards.find((card) => card.runtimeId === selectedCard.runtimeId);
    if (byRuntimeId) return byRuntimeId;
  }
  return allCards.find((card) => card.id === selectedCard.id) ?? selectedCard;
}
