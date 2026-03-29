// src/components/game/board/internal/resolve-live-selected-card.test.ts - Verifica que el detalle use carta viva y añada texto de pasiva V5.
import { describe, expect, it } from "vitest";
import { createTestGameState } from "@/core/use-cases/game-engine/test-support/state-fixtures";
import { resolveLiveSelectedCard } from "@/components/game/board/internal/resolve-live-selected-card";

describe("resolveLiveSelectedCard", () => {
  it("devuelve la versión viva de la carta seleccionada por runtimeId", () => {
    const state = createTestGameState({
      playerA: {
        id: "p1",
        name: "Player",
        healthPoints: 8000,
        maxHealthPoints: 8000,
        currentEnergy: 10,
        maxEnergy: 10,
        deck: [],
        hand: [],
        graveyard: [],
        destroyedPile: [],
        activeEntities: [
          {
            instanceId: "duck-board",
            card: {
              id: "entity-duckduckgo",
              runtimeId: "duck-rt-1",
              name: "Duck",
              description: "Base",
              type: "ENTITY",
              faction: "NEUTRAL",
              cost: 2,
              attack: 1000,
              defense: 2200,
              versionTier: 5,
            },
            mode: "ATTACK",
            hasAttackedThisTurn: false,
            isNewlySummoned: false,
          },
        ],
        activeExecutions: [],
      },
    });
    const selected = {
      id: "entity-duckduckgo",
      runtimeId: "duck-rt-1",
      name: "Duck",
      description: "Old",
      type: "ENTITY" as const,
      faction: "NEUTRAL" as const,
      cost: 2,
      attack: 1000,
      defense: 1700,
      versionTier: 1,
    };
    const resolved = resolveLiveSelectedCard(selected, state);
    expect(resolved?.defense).toBe(2200);
    expect(resolved?.description).toContain("[Pasiva V5]");
  });
});

