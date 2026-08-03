// src/components/game/board/hooks/internal/progression/build-player-owned-card-ids.test.ts - Valida la instantánea inicial de propiedad.
import { describe, expect, it } from "vitest";
import { createInitialGameState } from "@/core/use-cases/game-engine/state/create-initial-game-state";
import { buildPlayerOwnedCardIds } from "./build-player-owned-card-ids";

const createCard = (id: string) => ({
  id,
  name: id,
  description: "Carta de prueba",
  type: "ENTITY" as const,
  faction: "OPEN_SOURCE" as const,
  cost: 1,
  attack: 100,
  defense: 100,
});

describe("buildPlayerOwnedCardIds", () => {
  it("conserva cartas del mazo, mano inicial y fusion deck", () => {
    const state = createInitialGameState({
      playerA: {
        id: "p1",
        name: "Jugador",
        deck: [createCard("hand-card"), createCard("deck-card")],
        fusionDeck: [createCard("fusion-card")],
      },
      playerB: { id: "p2", name: "Rival", deck: [] },
      openingHandSize: 1,
    });

    expect([...buildPlayerOwnedCardIds(state.playerA)]).toEqual(["deck-card", "hand-card", "fusion-card"]);
  });
});
