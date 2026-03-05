// src/components/game/board/hooks/internal/progression/build-player-card-lookup.ts - Construye un índice por cardId con cartas visibles del jugador para overlays de progresión.
import { ICard } from "@/core/entities/ICard";
import { IPlayer } from "@/core/entities/IPlayer";

function registerCard(map: Record<string, ICard>, card: ICard): void {
  if (map[card.id]) return;
  map[card.id] = card;
}

export function buildPlayerCardLookup(player: IPlayer): Record<string, ICard> {
  const lookup: Record<string, ICard> = {};
  for (const card of player.deck) registerCard(lookup, card);
  for (const card of player.hand) registerCard(lookup, card);
  for (const card of player.graveyard) registerCard(lookup, card);
  for (const entity of player.activeEntities) registerCard(lookup, entity.card);
  for (const execution of player.activeExecutions) registerCard(lookup, execution.card);
  return lookup;
}
