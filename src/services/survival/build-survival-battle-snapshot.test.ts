// src/services/survival/build-survival-battle-snapshot.test.ts - Verifica el barajado determinista y variable de Survival.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { shuffleSurvivalDeck } from "./build-survival-battle-snapshot";

/** Crea cartas mínimas válidas para observar el orden sin acoplar el test al catálogo. */
function createDeck(): ICard[] {
  return Array.from({ length: 20 }, (_, index) => ({
    id: `card-${index}`,
    name: `Carta ${index}`,
    description: "Carta de prueba.",
    type: "ENTITY",
    faction: "OPEN_SOURCE",
    archetype: "TOOL",
    cost: 1,
    attack: 100,
    defense: 100,
    level: 0,
    xp: 0,
    versionTier: 0,
    renderUrl: "/assets/renders/test.webp",
  }));
}

describe("shuffleSurvivalDeck", () => {
  it("conserva el orden para la misma seed y lo cambia al reemitir con otra", () => {
    const deck = createDeck();
    const first = shuffleSurvivalDeck(deck, "battle-a:player-deck").map(({ id }) => id);
    const replay = shuffleSurvivalDeck(deck, "battle-a:player-deck").map(({ id }) => id);
    const reissued = shuffleSurvivalDeck(deck, "battle-b:player-deck").map(({ id }) => id);

    expect(replay).toEqual(first);
    expect(reissued).not.toEqual(first);
    expect(new Set(reissued)).toEqual(new Set(deck.map(({ id }) => id)));
  });
});
