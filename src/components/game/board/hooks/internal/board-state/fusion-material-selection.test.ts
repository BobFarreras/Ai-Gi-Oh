// src/components/game/board/hooks/internal/board-state/fusion-material-selection.test.ts - Pruebas de selección de materiales válidos para resaltado de fusión.
import { describe, expect, it } from "vitest";
import { GameState } from "@/core/use-cases/GameEngine";
import { resolveSelectableFusionMaterialIds } from "./fusion-material-selection";

function createState(): GameState {
  return {
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
      activeEntities: [
        {
          instanceId: "chatgpt-set",
          card: { id: "entity-chatgpt", name: "chatgpt", description: "", type: "ENTITY", faction: "BIG_TECH", cost: 5, archetype: "LLM" },
          mode: "SET",
          hasAttackedThisTurn: false,
          isNewlySummoned: false,
        },
        {
          instanceId: "gemini-defense",
          card: { id: "entity-gemini", name: "gemini", description: "", type: "ENTITY", faction: "BIG_TECH", cost: 5, archetype: "LLM" },
          mode: "DEFENSE",
          hasAttackedThisTurn: false,
          isNewlySummoned: false,
        },
        {
          instanceId: "other-attack",
          card: { id: "entity-kali-linux", name: "kali", description: "", type: "ENTITY", faction: "OPEN_SOURCE", cost: 4, archetype: "SECURITY" },
          mode: "ATTACK",
          hasAttackedThisTurn: false,
          isNewlySummoned: false,
        },
      ],
      activeExecutions: [],
    },
    playerB: {
      id: "p2",
      name: "Opponent",
      healthPoints: 8000,
      maxHealthPoints: 8000,
      currentEnergy: 10,
      maxEnergy: 10,
      deck: [],
      hand: [],
      graveyard: [],
      activeEntities: [],
      activeExecutions: [],
    },
    activePlayerId: "p1",
    startingPlayerId: "p1",
    turn: 2,
    phase: "MAIN_1",
    hasNormalSummonedThisTurn: false,
    combatLog: [],
    pendingTurnAction: {
      type: "SELECT_FUSION_MATERIALS",
      playerId: "p1",
      fusionFromExecutionRecipeId: "fusion-gemgpt",
      mode: "ATTACK",
      selectedMaterialInstanceIds: [],
    },
  };
}

describe("resolveSelectableFusionMaterialIds", () => {
  it("debería resaltar solo materiales de la receta, incluyendo SET y DEFENSE", () => {
    const result = resolveSelectableFusionMaterialIds(createState());
    expect(result).toEqual(expect.arrayContaining(["chatgpt-set", "gemini-defense"]));
    expect(result).not.toContain("other-attack");
  });
});
