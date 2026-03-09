// src/core/use-cases/game-engine/effects/resolve-execution-effects.integration.test.ts - Descripción breve del módulo.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";

const drawExecution: ICard = {
  id: "exec-draw-test",
  name: "Draw Test",
  description: "Roba 1 carta.",
  type: "EXECUTION",
  faction: "OPEN_SOURCE",
  cost: 1,
  effect: { action: "DRAW_CARD", cards: 1 },
};

function createState(overrides?: Partial<GameState>): GameState {
  return {
    playerA: {
      id: "p1",
      name: "Neo",
      healthPoints: 8000,
      maxHealthPoints: 8000,
      currentEnergy: 10,
      maxEnergy: 10,
      deck: [{ id: "entity-deck", name: "Deck Entity", description: "", type: "ENTITY", faction: "OPEN_SOURCE", cost: 2, attack: 800, defense: 1000 }],
      hand: [drawExecution],
      graveyard: [],
      activeEntities: [],
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
    ...overrides,
  };
}

describe("resolveExecution effects", () => {
  it("debería robar cartas al resolver DRAW_CARD", () => {
    let state = createState();
    state = GameEngine.playCard(state, "p1", "exec-draw-test", "ACTIVATE");
    state = GameEngine.resolveExecution(state, "p1", state.playerA.activeExecutions[0].instanceId);

    expect(state.playerA.hand).toHaveLength(1);
    expect(state.playerA.hand[0].id).toBe("entity-deck");
    expect(state.playerA.deck).toHaveLength(0);
  });

  it("debería aplicar BOOST_ATTACK_ALLIED_ENTITY sobre la mejor entidad aliada", () => {
    const buffExecution: ICard = {
      id: "exec-atk-buff-test",
      name: "Atk Buff",
      description: "Buff ataque",
      type: "EXECUTION",
      faction: "BIG_TECH",
      cost: 1,
      effect: { action: "BOOST_ATTACK_ALLIED_ENTITY", value: 400 },
    };
    let state = createState({
      playerA: {
        ...createState().playerA,
        hand: [buffExecution],
        activeEntities: [
          { instanceId: "weak", card: { id: "weak-card", name: "Weak", description: "", type: "ENTITY", faction: "OPEN_SOURCE", cost: 2, attack: 1000, defense: 1000 }, mode: "ATTACK", hasAttackedThisTurn: false, isNewlySummoned: false },
          { instanceId: "strong", card: { id: "strong-card", name: "Strong", description: "", type: "ENTITY", faction: "OPEN_SOURCE", cost: 3, attack: 1500, defense: 1000 }, mode: "ATTACK", hasAttackedThisTurn: false, isNewlySummoned: false },
        ],
      },
    });

    state = GameEngine.playCard(state, "p1", "exec-atk-buff-test", "ACTIVATE");
    state = GameEngine.resolveExecution(state, "p1", state.playerA.activeExecutions[0].instanceId);
    const boosted = state.playerA.activeEntities.find((entity) => entity.instanceId === "strong");
    const notBoosted = state.playerA.activeEntities.find((entity) => entity.instanceId === "weak");

    expect(boosted?.card.attack).toBe(1900);
    expect(notBoosted?.card.attack).toBe(1000);
  });

  it("debería bloquear BOOST_ATTACK_ALLIED_ENTITY sin entidades aliadas", () => {
    const buffExecution: ICard = {
      id: "exec-atk-buff-empty",
      name: "Atk Buff Empty",
      description: "Buff ataque",
      type: "EXECUTION",
      faction: "BIG_TECH",
      cost: 1,
      effect: { action: "BOOST_ATTACK_ALLIED_ENTITY", value: 400 },
    };
    let state = createState({
      playerA: {
        ...createState().playerA,
        hand: [buffExecution],
        activeEntities: [],
      },
    });

    state = GameEngine.playCard(state, "p1", "exec-atk-buff-empty", "ACTIVATE");
    expect(() => GameEngine.resolveExecution(state, "p1", state.playerA.activeExecutions[0].instanceId)).toThrow(
      "No tienes entidades en campo para aumentar ATK.",
    );
  });

  it("debería registrar HEAL_APPLIED al resolver curación", () => {
    const healExecution: ICard = {
      id: "exec-heal-test",
      name: "Heal Test",
      description: "Cura 500.",
      type: "EXECUTION",
      faction: "NO_CODE",
      cost: 1,
      effect: { action: "HEAL", target: "PLAYER", value: 500 },
    };
    let state = createState({
      playerA: {
        ...createState().playerA,
        healthPoints: 7000,
        hand: [healExecution],
      },
    });

    state = GameEngine.playCard(state, "p1", "exec-heal-test", "ACTIVATE");
    state = GameEngine.resolveExecution(state, "p1", state.playerA.activeExecutions[0].instanceId);

    const healLog = [...state.combatLog].reverse().find((event) => event.eventType === "HEAL_APPLIED");
    expect(healLog?.payload).toMatchObject({ targetPlayerId: "p1", amount: 500 });
    expect(state.playerA.healthPoints).toBe(7500);
  });
});

