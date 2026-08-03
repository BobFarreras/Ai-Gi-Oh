// src/components/game/board/hooks/internal/progression/build-player-owned-card-ids.ts - Captura las cartas propias al iniciar el duelo.
import { IPlayer } from "@/core/entities/IPlayer";

/**
 * Construye una instantánea inmutable de propiedad antes de que robos y cambios de zona alteren el tablero.
 */
export function buildPlayerOwnedCardIds(player: IPlayer): ReadonlySet<string> {
  const ownedCardIds = new Set<string>();
  for (const card of player.deck) ownedCardIds.add(card.id);
  for (const card of player.hand) ownedCardIds.add(card.id);
  for (const card of player.fusionDeck ?? []) ownedCardIds.add(card.id);
  return ownedCardIds;
}
