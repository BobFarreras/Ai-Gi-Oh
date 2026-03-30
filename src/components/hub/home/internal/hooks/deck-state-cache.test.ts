// src/components/hub/home/internal/hooks/deck-state-cache.test.ts - Verifica lectura/escritura del cache local de deck y fallback seguro por compatibilidad.
import { describe, expect, it } from "vitest";
import { IDeck } from "@/core/entities/home/IDeck";
import { readCachedDeck, writeCachedDeck } from "./deck-state-cache";

function createDeck(playerId: string): IDeck {
  return {
    playerId,
    slots: Array.from({ length: 20 }, (_, index) => ({ index, cardId: null })),
    fusionSlots: [{ index: 0, cardId: null }, { index: 1, cardId: null }],
  };
}

describe("deck-state-cache", () => {
  it("recupera el deck cacheado reciente para el mismo jugador", () => {
    const fallback = createDeck("p1");
    const cached = { ...fallback, slots: fallback.slots.map((slot) => (slot.index === 0 ? { ...slot, cardId: "entity-python" } : slot)) };
    writeCachedDeck("p1", cached);
    const resolved = readCachedDeck("p1", fallback);
    expect(resolved.slots[0]?.cardId).toBe("entity-python");
  });

  it("ignora cache incompatible y usa fallback", () => {
    const fallback = createDeck("p1");
    writeCachedDeck("p1", { ...fallback, playerId: "other-player" });
    const resolved = readCachedDeck("p1", fallback);
    expect(resolved.playerId).toBe("p1");
    expect(resolved.slots[0]?.cardId).toBeNull();
  });
});
