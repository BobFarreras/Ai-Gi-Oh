// src/core/use-cases/game-engine/phases/internal/resolve-discard-for-hand-limit-action.ts - Resuelve la acción pendiente de descarte por límite de mano y posterior robo.
import { IPlayer } from "@/core/entities/IPlayer";
import { NotFoundError } from "@/core/errors/NotFoundError";
import { appendCombatLogEvent } from "@/core/use-cases/game-engine/logging/combat-log";
import { assignPlayers, drawTopDeckCard } from "@/core/use-cases/game-engine/state/player-utils";
import { GameState } from "@/core/use-cases/game-engine/state/types";

/**
 * Ejecuta descarte obligatorio y aplica robo de reposición si existe mazo.
 */
export function resolveDiscardForHandLimitAction(
  state: GameState,
  playerId: string,
  selectedId: string,
  player: IPlayer,
  opponent: IPlayer,
  isPlayerA: boolean,
): GameState {
  const cardIndex = player.hand.findIndex((card) => card.runtimeId === selectedId || card.id === selectedId);
  if (cardIndex === -1) {
    throw new NotFoundError("La carta seleccionada no está en tu mano.");
  }

  const card = player.hand[cardIndex];
  const updatedPlayer: IPlayer = {
    ...player,
    hand: player.hand.filter((_, index) => index !== cardIndex),
    graveyard: [...player.graveyard, card],
  };

  const resolvedState = assignPlayers(
    {
      ...state,
      pendingTurnAction: null,
    },
    drawTopDeckCard(updatedPlayer),
    opponent,
    isPlayerA,
  );
  const withMandatory = appendCombatLogEvent(resolvedState, playerId, "MANDATORY_ACTION_RESOLVED", {
    type: "DISCARD_FOR_HAND_LIMIT",
    selectedId,
  });
  return appendCombatLogEvent(withMandatory, playerId, "CARD_TO_GRAVEYARD", {
    cardId: card.id,
    ownerPlayerId: playerId,
    from: "HAND",
  });
}
