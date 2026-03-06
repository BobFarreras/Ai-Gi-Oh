// src/services/home/deck-builder/deck-builder-actions.test.ts - Valida acciones de deck builder consumidas por la UI de Mi Home.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ENTITY_CARDS } from "@/core/data/mock-cards/entities";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IDeck } from "@/core/entities/home/IDeck";
import { HOME_DECK_SIZE } from "@/core/services/home/deck-rules";
import { addCardToDeckAction, evolveCardVersionAction, saveDeckAction } from "./deck-builder-actions";

function createEmptyDeck(playerId: string): IDeck {
  return {
    playerId,
    slots: Array.from({ length: HOME_DECK_SIZE }, (_, index) => ({ index, cardId: null })),
  };
}

function createCollection(): ICollectionCard[] {
  return ENTITY_CARDS.slice(0, 20).map((card) => ({ card, ownedCopies: 3 }));
}

describe("deck-builder-actions", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("añade carta al primer slot libre", async () => {
    const deck = createEmptyDeck("player-a");
    const collection = createCollection();
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...deck,
        slots: [{ index: 0, cardId: "entity-python" }, ...deck.slots.slice(1)],
      }),
    } as Response);
    const updatedDeck = await addCardToDeckAction({ playerId: "player-a", deck, collection }, "entity-python");
    expect(updatedDeck.slots[0].cardId).toBe("entity-python");
  });

  it("falla al guardar deck incompleto", async () => {
    const deck = createEmptyDeck("player-a");
    const collection = createCollection();
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "El deck debe tener 20 cartas para guardarse." }),
    } as Response);
    await expect(saveDeckAction({ playerId: "player-a", deck, collection })).rejects.toThrow("El deck debe tener 20 cartas");
  });

  it("evoluciona carta y devuelve progreso actualizado", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        progress: {
          playerId: "player-a",
          cardId: "entity-python",
          versionTier: 1,
          level: 0,
          xp: 0,
          masteryPassiveSkillId: null,
          updatedAtIso: new Date().toISOString(),
        },
        collection: [],
        consumedCopies: 4,
      }),
    } as Response);
    const response = await evolveCardVersionAction("player-a", "entity-python");
    expect(response.progress.versionTier).toBe(1);
    expect(response.consumedCopies).toBe(4);
  });
});
