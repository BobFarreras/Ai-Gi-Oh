// src/services/game/get-player-board-deck.ts - Resuelve el mazo persistido del jugador para inicializar el tablero de combate.
import { ICard } from "@/core/entities/ICard";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { applyCardProgressionToCard } from "@/services/game/apply-card-progression-to-card";
import { createPlayerRuntimeRepositories } from "@/services/player-persistence/create-player-runtime-repositories";

const HOME_DECK_SIZE = 20;
const HOME_FUSION_DECK_SIZE = 2;

export interface IPlayerBoardLoadout {
  deck: ICard[] | null;
  fusionDeck: ICard[] | null;
}

export async function getPlayerBoardDeck(): Promise<ICard[] | null> {
  const session = await getCurrentUserSession();
  if (!session?.user.id) return null;
  const repositories = await createPlayerRuntimeRepositories();
  const playerId = session.user.id;
  const [deck, collection, progressRows] = await Promise.all([
    repositories.deckRepository.getDeck(playerId),
    repositories.deckRepository.getCollection(playerId),
    repositories.playerCardProgressRepository.listByPlayer(playerId),
  ]);
  const cardById = new Map(collection.map((entry) => [entry.card.id, entry.card]));
  const progressByCardId = new Map(progressRows.map((progress) => [progress.cardId, progress]));
  const persistedDeck = deck.slots
    .map((slot) => {
      if (!slot.cardId) return null;
      const card = cardById.get(slot.cardId);
      if (!card) return null;
      return applyCardProgressionToCard(card, progressByCardId.get(slot.cardId) ?? null);
    })
    .filter((card): card is ICard => card !== null);
  if (persistedDeck.length !== HOME_DECK_SIZE) return null;
  return persistedDeck.map((card) => ({ ...card }));
}

export async function getPlayerBoardLoadout(): Promise<IPlayerBoardLoadout> {
  const session = await getCurrentUserSession();
  if (!session?.user.id) return { deck: null, fusionDeck: null };
  const repositories = await createPlayerRuntimeRepositories();
  const playerId = session.user.id;
  const [deck, collection, progressRows] = await Promise.all([
    repositories.deckRepository.getDeck(playerId),
    repositories.deckRepository.getCollection(playerId),
    repositories.playerCardProgressRepository.listByPlayer(playerId),
  ]);
  const cardById = new Map(collection.map((entry) => [entry.card.id, entry.card]));
  const progressByCardId = new Map(progressRows.map((progress) => [progress.cardId, progress]));
  const mainDeck = deck.slots
    .map((slot) => {
      if (!slot.cardId) return null;
      const card = cardById.get(slot.cardId);
      if (!card) return null;
      return applyCardProgressionToCard(card, progressByCardId.get(slot.cardId) ?? null);
    })
    .filter((card): card is ICard => card !== null);
  const fusionDeck = deck.fusionSlots
    .map((slot) => {
      if (!slot.cardId) return null;
      const card = cardById.get(slot.cardId);
      if (!card || card.type !== "FUSION") return null;
      return applyCardProgressionToCard(card, progressByCardId.get(slot.cardId) ?? null);
    })
    .filter((card): card is ICard => card !== null);
  return {
    deck: mainDeck.length === HOME_DECK_SIZE ? mainDeck.map((card) => ({ ...card })) : null,
    fusionDeck: fusionDeck.length === HOME_FUSION_DECK_SIZE ? fusionDeck.map((card) => ({ ...card })) : null,
  };
}
