// src/core/use-cases/game-engine/fusion/internal/assert-fusion-card-in-fusion-deck.ts - Valida que la carta final de fusión esté equipada en el fusion deck del jugador.
import { IPlayer } from "@/core/entities/IPlayer";
import { GameRuleError } from "@/core/errors/GameRuleError";

export function assertFusionCardInFusionDeck(player: IPlayer, fusionCardId: string): void {
  if (!player.fusionDeck) return;
  const hasFusionCard = (player.fusionDeck ?? []).some((card) => card.id === fusionCardId);
  if (!hasFusionCard) {
    throw new GameRuleError("No puedes fusionar: la carta final no está equipada en tu bloque de fusión.");
  }
}
