// src/core/use-cases/game-engine/fusion/fusion-selection-flow.integration.test.ts - Descripción breve del módulo.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";

const fusionCard: ICard = {
  id: "fusion-gemgpt",
  name: "GemGPT",
  description: "Fusion",
  type: "FUSION",
  faction: "BIG_TECH",
  cost: 7,
  attack: 3200,
  defense: 2600,
  fusionRecipeId: "fusion-gemgpt",
  fusionEnergyRequirement: 10,
};

function createEntity(instanceId: string, cardId: string): IBoardEntity {
  return {
    instanceId,
    card: {
      id: cardId,
      name: cardId,
      description: "",
      type: "ENTITY",
      faction: "OPEN_SOURCE",
      cost: 5,
      attack: 1000,
      defense: 1000,
      archetype: "LLM",
    },
    mode: "ATTACK",
    hasAttackedThisTurn: false,
    isNewlySummoned: false,
  };
}

function createState(): GameState {
  return {
    playerA: {
      id: "p1",
      name: "Neo",
      healthPoints: 8000,
      maxHealthPoints: 8000,
      currentEnergy: 10,
      maxEnergy: 10,
      deck: [],
      hand: [fusionCard],
      graveyard: [],
      activeEntities: [createEntity("m1", "entity-chatgpt"), createEntity("m2", "entity-gemini")],
      activeExecutions: [],
    },
    playerB: {
      id: "p2",
      name: "Smith",
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
    pendingTurnAction: null,
    combatLog: [],
  };
}

describe("GameEngine flujo de selección de fusión", () => {
  it("debería iniciar selección de materiales como acción pendiente", () => {
    const started = GameEngine.startFusionSummon(createState(), "p1", "fusion-gemgpt", "ATTACK");
    expect(started.pendingTurnAction?.type).toBe("SELECT_FUSION_MATERIALS");
    if (started.pendingTurnAction?.type === "SELECT_FUSION_MATERIALS") {
      expect(started.pendingTurnAction.selectedMaterialInstanceIds).toHaveLength(0);
      expect(started.pendingTurnAction.fusionCardId).toBe("fusion-gemgpt");
    }
  });

  it("debería completar fusión al seleccionar 2 materiales", () => {
    let state = GameEngine.startFusionSummon(createState(), "p1", "fusion-gemgpt", "ATTACK");
    state = GameEngine.resolvePendingTurnAction(state, "p1", "m1");
    expect(state.pendingTurnAction?.type).toBe("SELECT_FUSION_MATERIALS");
    if (state.pendingTurnAction?.type === "SELECT_FUSION_MATERIALS") {
      expect(state.pendingTurnAction.selectedMaterialInstanceIds).toEqual(["m1"]);
    }

    state = GameEngine.resolvePendingTurnAction(state, "p1", "m2");
    expect(state.pendingTurnAction).toBeNull();
    expect(state.playerA.activeEntities.some((entity) => entity.card.id === "fusion-gemgpt")).toBe(true);
    expect(state.playerA.graveyard.map((card) => card.id)).toEqual(expect.arrayContaining(["entity-chatgpt", "entity-gemini"]));
  });

  it("debería fallar sin bloquear si no hay 2 materiales válidos", () => {
    const state = createState();
    state.playerA.activeEntities = [createEntity("m1", "entity-chatgpt"), createEntity("mX", "entity-otro")];
    expect(() => GameEngine.startFusionSummon(state, "p1", "fusion-gemgpt", "ATTACK")).toThrow(
      "No puedes fusionar: faltan materiales válidos en el campo.",
    );
    const afterNextPhase = GameEngine.nextPhase(state);
    expect(afterNextPhase.phase).toBe("BATTLE");
    expect(afterNextPhase.pendingTurnAction).toBeNull();
  });
});

