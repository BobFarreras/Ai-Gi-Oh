// src/core/use-cases/GameEngine.integration.test.ts - Descripción breve del módulo.
import { describe, expect, it } from "vitest";
import { ICard } from "../entities/ICard";
import { IBoardEntity } from "../entities/IPlayer";
import { GameEngine, GameState } from "./GameEngine";

const playerEntity: ICard = {
  id: "entity-neo",
  name: "Gemini Vanguard",
  description: "Entidad principal de asalto.",
  type: "ENTITY",
  faction: "BIG_TECH",
  cost: 3,
  attack: 2500,
  defense: 2000,
};

const playerExecution: ICard = {
  id: "spell-ddos",
  name: "DDoS Burst",
  description: "Inflige daño directo al rival.",
  type: "EXECUTION",
  faction: "NO_CODE",
  cost: 2,
  effect: {
    action: "DAMAGE",
    target: "OPPONENT",
    value: 1200,
  },
};

const weakDefender: IBoardEntity = {
  instanceId: "defender-weak-1",
  card: {
    id: "entity-defender",
    name: "OpenClaw Shield",
    description: "Defensa ligera.",
    type: "ENTITY",
    faction: "OPEN_SOURCE",
    cost: 1,
    attack: 800,
    defense: 500,
  },
  mode: "DEFENSE",
  hasAttackedThisTurn: false,
  isNewlySummoned: false,
};

const createCombatState = (): GameState => ({
  playerA: {
    id: "p1",
    name: "Neo",
    healthPoints: 8000,
    maxHealthPoints: 8000,
    currentEnergy: 5,
    maxEnergy: 10,
    deck: [],
    hand: [playerEntity],
    graveyard: [],
    activeEntities: [],
    activeExecutions: [],
  },
  playerB: {
    id: "p2",
    name: "Smith",
    healthPoints: 8000,
    maxHealthPoints: 8000,
    currentEnergy: 4,
    maxEnergy: 10,
    deck: [],
    hand: [],
    graveyard: [],
    activeEntities: [weakDefender],
    activeExecutions: [],
  },
  activePlayerId: "p1",
  startingPlayerId: "p2",
  turn: 2,
  phase: "MAIN_1",
  hasNormalSummonedThisTurn: false,
  combatLog: [],
});

const createExecutionState = (): GameState => ({
  playerA: {
    id: "p1",
    name: "Neo",
    healthPoints: 8000,
    maxHealthPoints: 8000,
    currentEnergy: 5,
    maxEnergy: 10,
    deck: [],
    hand: [playerExecution],
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
  turn: 3,
  phase: "MAIN_1",
  hasNormalSummonedThisTurn: false,
  combatLog: [],
});

describe("GameEngine integración", () => {
  it("debería completar flujo de invocación, combate y cambio de turno", () => {
    let state = createCombatState();

    state = GameEngine.playCard(state, "p1", "entity-neo", "ATTACK");
    expect(state.playerA.currentEnergy).toBe(2);
    expect(state.playerA.activeEntities).toHaveLength(1);

    state = GameEngine.nextPhase(state);
    const attackerInstanceId = state.playerA.activeEntities[0].instanceId;
    state = GameEngine.executeAttack(state, "p1", attackerInstanceId, "defender-weak-1");

    expect(state.playerB.activeEntities).toHaveLength(0);
    expect(state.playerB.graveyard[0]?.id).toBe("entity-defender");
    expect(state.playerB.healthPoints).toBe(8000);

    state = GameEngine.nextPhase(state);

    expect(state.phase).toBe("MAIN_1");
    expect(state.turn).toBe(3);
    expect(state.activePlayerId).toBe("p2");
    expect(state.playerA.currentEnergy).toBe(2);
    expect(state.playerB.currentEnergy).toBe(6);
    expect(state.hasNormalSummonedThisTurn).toBe(false);
  });

  it("debería resolver una ejecución activada y moverla al cementerio", () => {
    let state = createExecutionState();

    state = GameEngine.playCard(state, "p1", "spell-ddos", "ACTIVATE");
    const executionInstanceId = state.playerA.activeExecutions[0].instanceId;

    state = GameEngine.resolveExecution(state, "p1", executionInstanceId);

    expect(state.playerB.healthPoints).toBe(6800);
    expect(state.playerA.activeExecutions).toHaveLength(0);
    expect(state.playerA.graveyard[0]?.id).toBe("spell-ddos");
  });
});

