// src/components/game/board/hooks/internal/boardInitialState.test.ts - Verifica inicialización del tablero con mazo persistido y fallback mock.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { createInitialBoardState } from "./boardInitialState";

function createCard(id: string): ICard {
  return {
    id,
    name: id,
    description: id,
    type: "ENTITY",
    faction: "OPEN_SOURCE",
    cost: 3,
    attack: 1200,
    defense: 1100,
  };
}

describe("boardInitialState", () => {
  it("usa mazo persistido si se proporciona", () => {
    const persistedDeck = Array.from({ length: 20 }, (_, index) => createCard(`persisted-${index}`));
    const state = createInitialBoardState({ playerDeck: persistedDeck });
    expect(state.playerA.hand).toHaveLength(4);
    expect(state.playerA.hand[0].id).toBe("persisted-0");
  });

  it("usa fallback mock cuando no hay mazo persistido", () => {
    const state = createInitialBoardState();
    expect(state.playerA.hand.length + state.playerA.deck.length).toBe(20);
  });
});
