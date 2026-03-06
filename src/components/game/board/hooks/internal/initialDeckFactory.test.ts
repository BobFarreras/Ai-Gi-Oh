import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { createPlayerDeckA, createPlayerDeckB, shuffleDeck } from "./initialDeckFactory";

function createEntity(id: string): ICard {
  return {
    id,
    name: id,
    description: "",
    type: "ENTITY",
    faction: "OPEN_SOURCE",
    cost: 1,
    attack: 100,
    defense: 100,
  };
}

describe("initialDeckFactory", () => {
  it("shuffleDeck mantiene todas las cartas sin perder elementos", () => {
    const deck = [createEntity("a"), createEntity("b"), createEntity("c"), createEntity("d")];
    const shuffled = shuffleDeck(deck, () => 0);

    expect(shuffled.map((card) => card.id)).toEqual(["b", "c", "d", "a"]);
    expect(shuffled).toHaveLength(deck.length);
    expect(shuffled.map((card) => card.id).sort()).toEqual(deck.map((card) => card.id).sort());
  });

  it("crea mazo del jugador A con 20 cartas", () => {
    const deck = createPlayerDeckA();
    expect(deck).toHaveLength(20);
  });

  it("crea mazo del jugador B con 20 cartas", () => {
    const deck = createPlayerDeckB();
    expect(deck).toHaveLength(20);
  });
});
