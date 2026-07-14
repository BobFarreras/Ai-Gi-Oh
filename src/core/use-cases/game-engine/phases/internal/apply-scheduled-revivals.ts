// src/core/use-cases/game-engine/phases/internal/apply-scheduled-revivals.ts - Revive en el inicio de turno
// las entities con pasiva REVIVE_NEXT_TURN (p.ej. Antigrabity) que estén en el cementerio del jugador.
// Reutiliza applyReturnGraveyardCardToField (colocación + eventos de VFX + auto-sacrificio si el campo
// está lleno), así que solo aporta el DISPARADOR automático al arrancar el turno.
import { IPlayer } from "@/core/entities/IPlayer";
import { REVIVE_NEXT_TURN_PASSIVE_ID } from "@/core/services/progression/mastery-passive-ids";
import { applyReturnGraveyardCardToField, IExecutionSystemEvent } from "@/core/use-cases/game-engine/actions/internal/execution-return-effects";
import { defaultGameEngineIdFactory, type IGameEngineIdFactory } from "@/core/use-cases/game-engine/state/id-factory";

export interface IScheduledRevivalEvent {
  eventType: IExecutionSystemEvent["eventType"] | "ENTITY_REVIVED";
  payload: Record<string, unknown>;
}

/**
 * Revive todas las entities con REVIVE_NEXT_TURN presentes en el cementerio del jugador. Como el revive
 * las saca del cementerio, solo vuelven a activarse si mueren de nuevo (no hay bucle infinito).
 */
export function applyScheduledRevivals(
  player: IPlayer,
  idFactory: IGameEngineIdFactory = defaultGameEngineIdFactory,
): { player: IPlayer; events: IScheduledRevivalEvent[] } {
  const reviveCards = player.graveyard.filter(
    (card) => card.type === "ENTITY" && card.masteryPassiveSkillId === REVIVE_NEXT_TURN_PASSIVE_ID,
  );
  if (reviveCards.length === 0) return { player, events: [] };

  let current = player;
  const events: IScheduledRevivalEvent[] = [];
  for (const card of reviveCards) {
    const cardReference = card.runtimeId ?? card.id;
    const result = applyReturnGraveyardCardToField(
      current,
      { action: "RETURN_GRAVEYARD_CARD_TO_FIELD", cardType: "ENTITY" },
      cardReference,
      idFactory,
    );
    current = result.updatedPlayer;
    for (const event of result.events) events.push(event);
    events.push({ eventType: "ENTITY_REVIVED", payload: { cardId: card.id, ownerPlayerId: player.id } });
  }
  return { player: current, events };
}
