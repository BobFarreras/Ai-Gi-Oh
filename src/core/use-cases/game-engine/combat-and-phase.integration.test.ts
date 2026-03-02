import { describe, expect, it } from "vitest";
import { ICard } from "../../entities/ICard";
import { IBoardEntity } from "../../entities/IPlayer";
import { GameEngine, GameState } from "../GameEngine";

const attackerCard: ICard = {
  id: "atk-1",
  name: "Attacker",
  description: "Entidad atacante.",
  type: "ENTITY",
  faction: "BIG_TECH",
  cost: 1,
  attack: 1500,
  defense: 1000,
};

const defenderCard: ICard = {
  id: "def-1",
  name: "Defender",
  description: "Entidad defensora.",
  type: "ENTITY",
  faction: "OPEN_SOURCE",
  cost: 1,
  attack: 2000,
  defense: 2200,
};

function entity(instanceId: string, card: ICard, mode: "ATTACK" | "DEFENSE" | "SET", attacked = false): IBoardEntity {
  return {
    instanceId,
    card,
    mode,
    hasAttackedThisTurn: attacked,
    isNewlySummoned: false,
  };
}

function createCombatState(): GameState {
  return {
    playerA: {
      id: "p1",
      name: "Neo",
      healthPoints: 8000,
      maxHealthPoints: 8000,
      currentEnergy: 10,
      maxEnergy: 10,
      deck: [],
      hand: [],
      graveyard: [],
      activeEntities: [entity("a-1", attackerCard, "ATTACK")],
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
      activeEntities: [entity("d-1", defenderCard, "ATTACK")],
      activeExecutions: [],
    },
    activePlayerId: "p1",
    startingPlayerId: "p2",
    turn: 2,
    phase: "BATTLE",
    hasNormalSummonedThisTurn: true,
  };
}

describe("GameEngine combate y fases", () => {
  it("debería rechazar estados de ataque inválidos", () => {
    const state = createCombatState();

    expect(() => GameEngine.executeAttack(state, "p1", "unknown", "d-1")).toThrow("La carta atacante no está en el campo");

    const wrongMode = {
      ...state,
      playerA: { ...state.playerA, activeEntities: [entity("a-1", attackerCard, "DEFENSE")] },
    };
    expect(() => GameEngine.executeAttack(wrongMode, "p1", "a-1", "d-1")).toThrow(
      "Solo las cartas en modo ATAQUE pueden atacar",
    );

    const alreadyAttacked = {
      ...state,
      playerA: { ...state.playerA, activeEntities: [entity("a-1", attackerCard, "ATTACK", true)] },
    };
    expect(() => GameEngine.executeAttack(alreadyAttacked, "p1", "a-1", "d-1")).toThrow(
      "Esta carta ya ha atacado este turno",
    );
  });

  it("debería bloquear ataque directo con defensores y validar objetivo", () => {
    const state = createCombatState();
    expect(() => GameEngine.executeAttack(state, "p1", "a-1")).toThrow(
      "No puedes atacar directamente si el oponente tiene entidades en el campo.",
    );
    expect(() => GameEngine.executeAttack(state, "p1", "a-1", "unknown")).toThrow("La carta defensora no está en el campo");
  });

  it("debería resolver ataque directo y combate con atacante destruido", () => {
    const directAttackState = {
      ...createCombatState(),
      playerB: { ...createCombatState().playerB, activeEntities: [] },
    };
    const directResult = GameEngine.executeAttack(directAttackState, "p1", "a-1");
    expect(directResult.playerB.healthPoints).toBe(6500);

    const battleState = createCombatState();
    const battleResult = GameEngine.executeAttack(battleState, "p1", "a-1", "d-1");

    expect(battleResult.playerA.activeEntities).toHaveLength(0);
    expect(battleResult.playerA.graveyard[0]?.id).toBe("atk-1");
    expect(battleResult.playerA.healthPoints).toBe(7500);
  });

  it("debería cambiar de fase y reiniciar estado al cerrar turno", () => {
    let state = createCombatState();
    state = { ...state, phase: "MAIN_1" };
    state = GameEngine.nextPhase(state);
    expect(state.phase).toBe("BATTLE");

    state = GameEngine.nextPhase(state);
    expect(state.phase).toBe("MAIN_1");
    expect(state.turn).toBe(3);
    expect(state.activePlayerId).toBe("p2");
    expect(state.playerA.currentEnergy).toBe(10);
    expect(state.playerA.activeEntities[0].hasAttackedThisTurn).toBe(false);
    expect(state.playerA.activeEntities[0].isNewlySummoned).toBe(false);
  });

  it("debería lanzar error con jugador inválido al usar el motor", () => {
    expect(() => GameEngine.changeEntityMode(createCombatState(), "invalid", "a-1", "DEFENSE")).toThrow("Jugador inválido.");
  });

  it("debería robar una carta al cerrar combate y pasar turno", () => {
    const drawCard: ICard = {
      id: "deck-1",
      name: "Carta de robo",
      description: "Test de robo.",
      type: "ENTITY",
      faction: "NEUTRAL",
      cost: 1,
      attack: 1000,
      defense: 1000,
    };

    const state = {
      ...createCombatState(),
      phase: "BATTLE" as const,
      activePlayerId: "p2",
      playerA: {
        ...createCombatState().playerA,
        hand: [],
        deck: [drawCard],
      },
    };

    const nextState = GameEngine.nextPhase(state);
    expect(nextState.phase).toBe("MAIN_1");
    expect(nextState.playerA.hand[0]?.id).toBe("deck-1");
    expect(nextState.playerA.deck).toHaveLength(0);
    expect(nextState.activePlayerId).toBe("p1");
  });

  it("debería impedir ataque del jugador inicial en el turno 1", () => {
    const state = {
      ...createCombatState(),
      startingPlayerId: "p1",
      turn: 1,
    };

    expect(() => GameEngine.executeAttack(state, "p1", "a-1", "d-1")).toThrow(
      "El jugador inicial no puede atacar durante el primer turno.",
    );
  });
});
