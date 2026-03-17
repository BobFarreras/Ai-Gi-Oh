// src/core/use-cases/game-engine/combat/phase-transition.integration.test.ts - Pruebas de transición de fase/turno y validaciones de cambio de estado del jugador.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { GameEngine } from "@/core/use-cases/GameEngine";
import { createCombatState } from "@/core/use-cases/game-engine/combat/combat-and-phase.test-fixtures";

describe("GameEngine transiciones de fase", () => {
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
    const base = createCombatState();
    const state = {
      ...base,
      phase: "BATTLE" as const,
      activePlayerId: "p2",
      playerA: {
        ...base.playerA,
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
});
