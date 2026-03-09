// src/components/game/board/hooks/internal/opponent-turn/autoPick.ts - Descripción breve del módulo.
import { ICard } from "@/core/entities/ICard";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { IOpponentAutoPick } from "./types";

function scoreCardForDiscard(card: ICard): number {
  if (card.type === "ENTITY") {
    return (card.attack ?? 0) + (card.defense ?? 0) - card.cost * 180;
  }
  const effectValue = card.effect && "value" in card.effect ? card.effect.value : 0;
  return effectValue - card.cost * 140;
}

function chooseEntityToSacrifice(entities: IBoardEntity[]): IBoardEntity | null {
  if (entities.length === 0) return null;
  return entities.reduce((weakest, current) => {
    const weakestScore = (weakest.card.attack ?? 0) + (weakest.card.defense ?? 0);
    const currentScore = (current.card.attack ?? 0) + (current.card.defense ?? 0);
    return currentScore < weakestScore ? current : weakest;
  });
}

function chooseCardToDiscard(hand: ICard[]): ICard | null {
  if (hand.length === 0) return null;
  return hand.reduce((worst, current) => (scoreCardForDiscard(current) < scoreCardForDiscard(worst) ? current : worst));
}

export const opponentAutoPick: IOpponentAutoPick = {
  chooseCardToDiscard,
  chooseEntityToSacrifice,
};

