// src/core/use-cases/game-engine/actions/internal/execution-return-effects.ts - Resuelve retornos desde cementerio a mano/campo con reglas de overflow seguro.
import { CardType, ICard, IReturnGraveyardCardToFieldEffect, IReturnGraveyardCardToHandEffect } from "@/core/entities/ICard";
import { BattleMode, IPlayer } from "@/core/entities/IPlayer";
import { GameRuleError } from "@/core/errors/GameRuleError";
import { defaultGameEngineIdFactory, type IGameEngineIdFactory } from "@/core/use-cases/game-engine/state/id-factory";

export interface IExecutionSystemEvent {
  eventType: "CARD_TO_DESTROYED";
  payload: Record<string, unknown>;
}

function resolveSelectedGraveyardCard(graveyard: readonly ICard[], selectedCardReference: string, cardType?: CardType): [ICard, number] {
  const targetIndex = graveyard.findIndex((card) => (card.runtimeId ?? card.id) === selectedCardReference);
  const targetCard = targetIndex >= 0 ? graveyard[targetIndex] : null;
  if (!targetCard) throw new GameRuleError("La carta seleccionada no está en el cementerio.");
  if (cardType && targetCard.type !== cardType) throw new GameRuleError("La carta seleccionada no cumple el tipo permitido.");
  return [targetCard, targetIndex];
}

function createRevivedEntity(
  cardId: string,
  cardType: CardType,
  cardIndex: number,
  idFactory: IGameEngineIdFactory,
): { instanceId: string; mode: BattleMode } {
  const mode: BattleMode = cardType === "ENTITY" ? "ATTACK" : "SET";
  return { instanceId: idFactory.createRevivedInstanceId(cardId, cardIndex), mode };
}

export function applyReturnGraveyardCardToHand(
  player: IPlayer,
  effect: IReturnGraveyardCardToHandEffect,
  selectedCardReference: string,
): { updatedPlayer: IPlayer; events: IExecutionSystemEvent[] } {
  const [targetCard, targetIndex] = resolveSelectedGraveyardCard(player.graveyard, selectedCardReference, effect.cardType);
  const nextGraveyard = player.graveyard.filter((_, index) => index !== targetIndex);
  const events: IExecutionSystemEvent[] = [];
  let nextHand = [...player.hand];
  let nextDestroyed = [...(player.destroyedPile ?? [])];
  if (nextHand.length >= 5) {
    const destroyedFromHand = nextHand[0];
    nextHand = nextHand.slice(1);
    nextDestroyed = [...nextDestroyed, destroyedFromHand];
    events.push({
      eventType: "CARD_TO_DESTROYED",
      payload: { cardId: destroyedFromHand.id, ownerPlayerId: player.id, from: "HAND" },
    });
  }
  nextHand = [...nextHand, targetCard];
  return {
    updatedPlayer: { ...player, hand: nextHand, graveyard: nextGraveyard, destroyedPile: nextDestroyed },
    events,
  };
}

export function applyReturnGraveyardCardToField(
  player: IPlayer,
  effect: IReturnGraveyardCardToFieldEffect,
  selectedCardReference: string,
  idFactory: IGameEngineIdFactory = defaultGameEngineIdFactory,
): { updatedPlayer: IPlayer; events: IExecutionSystemEvent[] } {
  const [targetCard, targetIndex] = resolveSelectedGraveyardCard(player.graveyard, selectedCardReference, effect.cardType);
  const nextGraveyard = player.graveyard.filter((_, index) => index !== targetIndex);
  const events: IExecutionSystemEvent[] = [];
  const isEntity = targetCard.type === "ENTITY";
  let nextEntities = [...player.activeEntities];
  let nextExecutions = [...player.activeExecutions];
  let nextDestroyed = [...(player.destroyedPile ?? [])];
  if (isEntity) {
    if (nextEntities.length >= 3) {
      const destroyedEntity = nextEntities[0];
      nextEntities = nextEntities.slice(1);
      nextDestroyed = [...nextDestroyed, destroyedEntity.card];
      events.push({
        eventType: "CARD_TO_DESTROYED",
        payload: { cardId: destroyedEntity.card.id, ownerPlayerId: player.id, from: "BATTLEFIELD" },
      });
    }
    const revived = createRevivedEntity(targetCard.id, targetCard.type, nextEntities.length, idFactory);
    nextEntities = [...nextEntities, { instanceId: revived.instanceId, card: targetCard, mode: revived.mode, hasAttackedThisTurn: false, isNewlySummoned: true }];
  } else {
    if (nextExecutions.length >= 3) {
      const destroyedExecution = nextExecutions[0];
      nextExecutions = nextExecutions.slice(1);
      nextDestroyed = [...nextDestroyed, destroyedExecution.card];
      events.push({
        eventType: "CARD_TO_DESTROYED",
        payload: { cardId: destroyedExecution.card.id, ownerPlayerId: player.id, from: "EXECUTION_ZONE" },
      });
    }
    const revived = createRevivedEntity(targetCard.id, targetCard.type, nextExecutions.length, idFactory);
    nextExecutions = [...nextExecutions, { instanceId: revived.instanceId, card: targetCard, mode: revived.mode, hasAttackedThisTurn: false, isNewlySummoned: true }];
  }
  return {
    updatedPlayer: {
      ...player,
      graveyard: nextGraveyard,
      activeEntities: nextEntities,
      activeExecutions: nextExecutions,
      destroyedPile: nextDestroyed,
    },
    events,
  };
}
