// src/core/services/home/deck-rules.test.ts - Verifica reglas de tamaño y duplicados del constructor de mazos.
import { describe, expect, it } from "vitest";
import { IDeck } from "@/core/entities/home/IDeck";
import { assertCanAddCardToDeck, assertDeckReadyToSave, HOME_DECK_SIZE } from "./deck-rules";

function createDeckWithCardCopies(cardId: string, copies: number): IDeck {
  const slots = Array.from({ length: HOME_DECK_SIZE }, (_, index) => ({
    index,
    cardId: index < copies ? cardId : null,
  }));
  return { playerId: "player-a", slots };
}

describe("deck-rules", () => {
  it("bloquea la cuarta copia de una carta", () => {
    const deck = createDeckWithCardCopies("entity-python", 3);
    expect(() => assertCanAddCardToDeck(deck, "entity-python")).toThrow("No se permiten más de 3 copias");
  });

  it("bloquea guardar deck incompleto", () => {
    const deck = createDeckWithCardCopies("entity-python", 5);
    expect(() => assertDeckReadyToSave(deck)).toThrow("El deck debe tener 20 cartas");
  });
});
