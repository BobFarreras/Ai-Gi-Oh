// src/core/use-cases/game-engine/state/create-initial-game-state.test.ts - Verifica reparto inicial y selección de jugador inicial.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { createInitialGameState } from "./create-initial-game-state";

function createDeck(prefix: string, size: number): ICard[] {
  return Array.from({ length: size }).map((_, index) => ({
    id: `${prefix}-${index + 1}`,
    name: `${prefix.toUpperCase()} ${index + 1}`,
    description: "Carta de test",
    type: "ENTITY",
    faction: "NEUTRAL",
    cost: 1,
    attack: 1000,
    defense: 1000,
  }));
}

describe("createInitialGameState", () => {
  it("debería repartir mano inicial y dejar el resto en el mazo", () => {
    const state = createInitialGameState({
      playerA: { id: "p1", name: "Neo", deck: createDeck("a", 20) },
      playerB: { id: "p2", name: "Smith", deck: createDeck("b", 20) },
      starterPlayerId: "p1",
    });

    expect(state.playerA.hand).toHaveLength(3);
    expect(state.playerA.deck).toHaveLength(17);
    expect(state.playerB.hand).toHaveLength(3);
    expect(state.playerB.deck).toHaveLength(17);
    expect(state.activePlayerId).toBe("p1");
    expect(state.startingPlayerId).toBe("p1");
    expect(state.phase).toBe("MAIN_1");
  });

  it("debería elegir jugador inicial aleatorio cuando no se especifica", () => {
    const state = createInitialGameState({
      playerA: { id: "p1", name: "Neo", deck: createDeck("a", 20) },
      playerB: { id: "p2", name: "Smith", deck: createDeck("b", 20) },
      randomSource: () => 0.8,
    });

    expect(state.startingPlayerId).toBe("p2");
    expect(state.activePlayerId).toBe("p2");
  });
});

