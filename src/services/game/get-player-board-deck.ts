// src/services/game/get-player-board-deck.ts - Resuelve el mazo persistido del jugador para inicializar el tablero de combate.
import { ICard } from "@/core/entities/ICard";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { applyCardProgressionToCard } from "@/services/game/apply-card-progression-to-card";
import { createPlayerRuntimeRepositories } from "@/services/player-persistence/create-player-runtime-repositories";

const HOME_DECK_SIZE = 20;

export interface IPlayerBoardLoadout {
  deck: ICard[] | null;
  fusionDeck: ICard[] | null;
}

/** Carga el loadout del jugador ya autenticado sin volver a inferir su identidad. */
export async function getPlayerBoardLoadoutByPlayerId(playerId: string): Promise<IPlayerBoardLoadout> {
  const repositories = await createPlayerRuntimeRepositories();
  const [deck, collection, progressRows, upgradesByCardId] = await Promise.all([
    repositories.deckRepository.getDeck(playerId),
    repositories.deckRepository.getCollection(playerId),
    repositories.playerCardProgressRepository.listByPlayer(playerId),
    repositories.playerCardUpgradesRepository.getUpgradesByPlayer(playerId),
  ]);
  const cardById = new Map(collection.map((entry) => [entry.card.id, entry.card]));
  const progressByCardId = new Map(progressRows.map((progress) => [progress.cardId, progress]));
  const resolveCard = (cardId: string | null) => {
    if (!cardId) return null;
    const card = cardById.get(cardId);
    return card
      ? applyCardProgressionToCard(card, progressByCardId.get(cardId) ?? null, upgradesByCardId.get(cardId))
      : null;
  };
  const mainDeck = deck.slots.map((slot) => resolveCard(slot.cardId)).filter((card): card is ICard => card !== null);
  const fusionDeck = deck.fusionSlots
    .map((slot) => resolveCard(slot.cardId))
    .filter((card): card is ICard => card?.type === "FUSION");
  return {
    deck: mainDeck.length === HOME_DECK_SIZE ? mainDeck.map((card) => ({ ...card })) : null,
    fusionDeck: fusionDeck.map((card) => ({ ...card })),
  };
}

export async function getPlayerBoardLoadout(): Promise<IPlayerBoardLoadout> {
  const session = await getCurrentUserSession();
  if (!session?.user.id) return { deck: null, fusionDeck: null };
  return getPlayerBoardLoadoutByPlayerId(session.user.id);
}
