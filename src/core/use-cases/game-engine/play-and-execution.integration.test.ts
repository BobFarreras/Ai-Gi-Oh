import { describe, expect, it } from "vitest";
import { ICard } from "../../entities/ICard";
import { IBoardEntity } from "../../entities/IPlayer";
import { GameEngine, GameState } from "../GameEngine";

const entityCard: ICard = {
  id: "entity-1",
  name: "Gemini",
  description: "Entidad ofensiva.",
  type: "ENTITY",
  faction: "BIG_TECH",
  cost: 3,
  attack: 2500,
  defense: 2000,
};

const spellCard: ICard = {
  id: "spell-1",
  name: "Patch Heal",
  description: "Recupera vida.",
  type: "EXECUTION",
  faction: "NO_CODE",
  cost: 2,
  effect: {
    action: "HEAL",
    target: "PLAYER",
    value: 500,
  },
};

function createBaseState(overrides?: Partial<GameState>): GameState {
  return {
    playerA: {
      id: "p1",
      name: "Neo",
      healthPoints: 7000,
      maxHealthPoints: 8000,
      currentEnergy: 5,
      maxEnergy: 10,
      deck: [],
      hand: [entityCard, spellCard],
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
    turn: 1,
    phase: "MAIN_1",
    hasNormalSummonedThisTurn: false,
    ...overrides,
  };
}

describe("GameEngine reglas de juego", () => {
  it("debería validar turno, fase y carta en mano", () => {
    expect(() => GameEngine.playCard(createBaseState({ activePlayerId: "p2" }), "p1", "entity-1", "ATTACK")).toThrow(
      "No es tu turno.",
    );
    expect(() => GameEngine.playCard(createBaseState({ phase: "BATTLE" }), "p1", "entity-1", "ATTACK")).toThrow(
      "Solo puedes jugar cartas en la fase de despliegue.",
    );
    expect(() => GameEngine.playCard(createBaseState(), "p1", "unknown", "ATTACK")).toThrow("La carta no está en la mano.");
  });

  it("debería validar energía y reglas de invocación de entidad", () => {
    const lowEnergyState = createBaseState();
    lowEnergyState.playerA.currentEnergy = 1;
    expect(() => GameEngine.playCard(lowEnergyState, "p1", "entity-1", "ATTACK")).toThrow("Energía insuficiente.");

    const summonUsed = createBaseState({ hasNormalSummonedThisTurn: true });
    expect(() => GameEngine.playCard(summonUsed, "p1", "entity-1", "ATTACK")).toThrow(
      "Ya has invocado una entidad este turno.",
    );

    const fullEntityZone = createBaseState();
    fullEntityZone.playerA.activeEntities = [1, 2, 3].map(
      (id) => ({ instanceId: `slot-${id}`, card: entityCard, mode: "ATTACK", hasAttackedThisTurn: false, isNewlySummoned: false }) as IBoardEntity,
    );
    expect(() => GameEngine.playCard(fullEntityZone, "p1", "entity-1", "ATTACK")).toThrow("Tu zona de entidades está llena.");

    expect(() => GameEngine.playCard(createBaseState(), "p1", "entity-1", "SET")).toThrow("Modo inválido para una entidad.");
  });

  it("debería validar reglas de ejecución y resolver curación", () => {
    const fullExecutionZone = createBaseState();
    fullExecutionZone.playerA.hand = [spellCard];
    fullExecutionZone.playerA.activeExecutions = [1, 2, 3].map(
      (id) => ({ instanceId: `exec-${id}`, card: spellCard, mode: "SET", hasAttackedThisTurn: false, isNewlySummoned: false }) as IBoardEntity,
    );

    expect(() => GameEngine.playCard(fullExecutionZone, "p1", "spell-1", "SET")).toThrow("Tu zona de ejecuciones está llena.");
    expect(() => GameEngine.playCard(createBaseState({}), "p1", "spell-1", "ATTACK")).toThrow(
      "Modo inválido para una ejecución.",
    );

    let state = createBaseState();
    state = GameEngine.playCard(state, "p1", "spell-1", "ACTIVATE");
    const executionId = state.playerA.activeExecutions[0].instanceId;
    state = GameEngine.resolveExecution(state, "p1", executionId);

    expect(state.playerA.healthPoints).toBe(7500);
    expect(state.playerA.activeExecutions).toHaveLength(0);
    expect(state.playerA.graveyard[0]?.id).toBe("spell-1");
  });

  it("debería cambiar modo en entidades y ejecuciones", () => {
    let state = createBaseState();
    state = GameEngine.playCard(state, "p1", "entity-1", "ATTACK");
    state = GameEngine.playCard(
      {
        ...state,
        hasNormalSummonedThisTurn: true,
        playerA: { ...state.playerA, hand: [spellCard] },
      },
      "p1",
      "spell-1",
      "SET",
    );

    const entityId = state.playerA.activeEntities[0].instanceId;
    const executionId = state.playerA.activeExecutions[0].instanceId;

    state = GameEngine.changeEntityMode(state, "p1", entityId, "DEFENSE");
    state = GameEngine.changeEntityMode(state, "p1", executionId, "ACTIVATE");

    expect(state.playerA.activeEntities[0].mode).toBe("DEFENSE");
    expect(state.playerA.activeExecutions[0].mode).toBe("ACTIVATE");
  });
});
