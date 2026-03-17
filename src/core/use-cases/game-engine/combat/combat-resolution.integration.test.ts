// src/core/use-cases/game-engine/combat/combat-resolution.integration.test.ts - Pruebas de validación y resolución de ataques del motor de combate.
import { describe, expect, it } from "vitest";
import { GameEngine } from "@/core/use-cases/GameEngine";
import { attackerCard, createCombatState, createEntity } from "@/core/use-cases/game-engine/combat/combat-and-phase.test-fixtures";

describe("GameEngine combate", () => {
  it("debería rechazar estados de ataque inválidos", () => {
    const state = createCombatState();

    expect(() => GameEngine.executeAttack(state, "p1", "unknown", "d-1")).toThrow("La carta atacante no está en el campo");

    const wrongMode = {
      ...state,
      playerA: { ...state.playerA, activeEntities: [createEntity("a-1", attackerCard, "DEFENSE")] },
    };
    expect(() => GameEngine.executeAttack(wrongMode, "p1", "a-1", "d-1")).toThrow("Solo las cartas en modo ATAQUE pueden atacar");

    const alreadyAttacked = {
      ...state,
      playerA: { ...state.playerA, activeEntities: [createEntity("a-1", attackerCard, "ATTACK", true)] },
    };
    expect(() => GameEngine.executeAttack(alreadyAttacked, "p1", "a-1", "d-1")).toThrow("Esta carta ya ha atacado este turno");
  });

  it("debería bloquear ataque directo con defensores y validar objetivo", () => {
    const state = createCombatState();
    expect(() => GameEngine.executeAttack(state, "p1", "a-1")).toThrow("No puedes atacar directamente si el oponente tiene entidades en el campo.");
    expect(() => GameEngine.executeAttack(state, "p1", "a-1", "unknown")).toThrow("La carta defensora no está en el campo");
  });

  it("debería resolver ataque directo y combate con atacante destruido", () => {
    const base = createCombatState();
    const directAttackState = {
      ...base,
      playerB: { ...base.playerB, activeEntities: [] },
    };
    const directResult = GameEngine.executeAttack(directAttackState, "p1", "a-1");
    expect(directResult.playerB.healthPoints).toBe(6500);

    const battleResult = GameEngine.executeAttack(createCombatState(), "p1", "a-1", "d-1");
    expect(battleResult.playerA.activeEntities).toHaveLength(0);
    expect(battleResult.playerA.graveyard[0]?.id).toBe("atk-1");
    expect(battleResult.playerA.healthPoints).toBe(7500);
  });

  it("debería impedir ataque del jugador inicial en el turno 1", () => {
    const state = {
      ...createCombatState(),
      startingPlayerId: "p1",
      turn: 1,
    };
    expect(() => GameEngine.executeAttack(state, "p1", "a-1", "d-1")).toThrow("El jugador inicial no puede atacar durante el primer turno.");
  });
});
