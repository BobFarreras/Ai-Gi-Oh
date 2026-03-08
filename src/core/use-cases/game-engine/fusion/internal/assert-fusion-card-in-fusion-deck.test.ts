// src/core/use-cases/game-engine/fusion/internal/assert-fusion-card-in-fusion-deck.test.ts - Garantiza validación de carta final equipada en fusion deck.
import { describe, expect, it } from "vitest";
import { IPlayer } from "@/core/entities/IPlayer";
import { assertFusionCardInFusionDeck } from "./assert-fusion-card-in-fusion-deck";

function createPlayer(fusionDeckIds: string[] | null): IPlayer {
  return {
    id: "p1",
    name: "Arquitecto",
    healthPoints: 8000,
    maxHealthPoints: 8000,
    currentEnergy: 10,
    maxEnergy: 10,
    deck: [],
    fusionDeck: fusionDeckIds?.map((id) => ({ id, name: id, description: id, type: "FUSION", faction: "NEUTRAL", cost: 5 })) ?? undefined,
    hand: [],
    graveyard: [],
    destroyedPile: [],
    activeEntities: [],
    activeExecutions: [],
  };
}

describe("assertFusionCardInFusionDeck", () => {
  it("acepta cuando la carta está equipada", () => {
    expect(() => assertFusionCardInFusionDeck(createPlayer(["fusion-gemgpt"]), "fusion-gemgpt")).not.toThrow();
  });

  it("lanza error cuando no está equipada y existe bloque configurado", () => {
    expect(() => assertFusionCardInFusionDeck(createPlayer(["fusion-pytgress"]), "fusion-gemgpt")).toThrow("carta final no está equipada");
  });

  it("permite estado legacy sin fusion deck definido", () => {
    expect(() => assertFusionCardInFusionDeck(createPlayer(null), "fusion-gemgpt")).not.toThrow();
  });
});
