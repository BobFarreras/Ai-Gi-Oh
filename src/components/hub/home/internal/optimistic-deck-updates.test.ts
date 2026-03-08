// src/components/hub/home/internal/optimistic-deck-updates.test.ts - Valida inserción y retirada optimista de cartas en deck.
import { describe, expect, it } from "vitest";
import { IDeck } from "@/core/entities/home/IDeck";
import { applyOptimisticAddToDeck, applyOptimisticRemoveFromDeck } from "@/components/hub/home/internal/optimistic-deck-updates";

function createDeck(): IDeck {
  return {
    playerId: "player-a",
    slots: [
      { index: 0, cardId: "entity-a" },
      { index: 1, cardId: null },
    ],
    fusionSlots: [
      { index: 0, cardId: null },
      { index: 1, cardId: null },
    ],
  };
}

describe("optimistic-deck-updates", () => {
  it("añade carta al primer slot vacío", () => {
    const updatedDeck = applyOptimisticAddToDeck(createDeck(), "entity-b");
    expect(updatedDeck.slots[1].cardId).toBe("entity-b");
  });

  it("retira carta del slot indicado", () => {
    const updatedDeck = applyOptimisticRemoveFromDeck(createDeck(), 0);
    expect(updatedDeck.slots[0].cardId).toBeNull();
  });
});
