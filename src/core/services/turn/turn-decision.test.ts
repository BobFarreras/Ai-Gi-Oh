// src/core/services/turn/turn-decision.test.ts - Pruebas unitarias de decisiones de auto-pase y avisos de avance de fase.
import { IBoardEntity } from "@/core/entities/IPlayer";
import { describe, expect, it } from "vitest";
import { canAutoAdvanceBattle, canPlayerDeclareAttacks, hasAvailableBattleActions, shouldShowAdvanceWarning } from "./turn-decision";

function createEntity(mode: IBoardEntity["mode"], hasAttackedThisTurn = false, isNewlySummoned = false): IBoardEntity {
  return {
    instanceId: `entity-${mode}-${hasAttackedThisTurn ? "used" : "ready"}`,
    card: { id: "entity-test", name: "Test", description: "Test", type: "ENTITY", faction: "OPEN_SOURCE", cost: 1, attack: 100, defense: 100 },
    mode,
    hasAttackedThisTurn,
    isNewlySummoned,
  };
}

describe("turn-decision", () => {
  it("detecta acciones disponibles en BATTLE con entidades en ATTACK listas", () => {
    const result = hasAvailableBattleActions([createEntity("ATTACK", false, false), createEntity("ATTACK", true, false)]);
    expect(result).toBe(true);
  });

  it("detecta acciones disponibles en BATTLE con entidades en DEFENSE/SET convertibles", () => {
    const result = hasAvailableBattleActions([createEntity("DEFENSE", false, false), createEntity("SET", true, false)]);
    expect(result).toBe(true);
  });

  it("permite auto-pase solo cuando ya no quedan acciones de batalla", () => {
    const result = canAutoAdvanceBattle({
      phase: "BATTLE",
      winnerPlayerId: null,
      isAnimating: false,
      isPlayerTurn: true,
      pendingTurnActionPlayerId: null,
      playerId: "p1",
      activeEntities: [createEntity("ATTACK", true, false), createEntity("SET", true, false)],
      turn: 2,
      startingPlayerId: "p2",
    });
    expect(result).toBe(true);
  });

  it("bloquea el auto-pase en BATTLE si aún hay acciones disponibles", () => {
    const result = canAutoAdvanceBattle({
      phase: "BATTLE",
      winnerPlayerId: null,
      isAnimating: false,
      isPlayerTurn: true,
      pendingTurnActionPlayerId: null,
      playerId: "p1",
      activeEntities: [createEntity("ATTACK", true, false), createEntity("ATTACK", false, false)],
      turn: 2,
      startingPlayerId: "p2",
    });
    expect(result).toBe(false);
  });

  it("no auto-pasa cuando hay 2 atacantes y solo uno ya atacó", () => {
    const result = canAutoAdvanceBattle({
      phase: "BATTLE",
      winnerPlayerId: null,
      isAnimating: false,
      isPlayerTurn: true,
      pendingTurnActionPlayerId: null,
      playerId: "p1",
      activeEntities: [createEntity("ATTACK", true, false), createEntity("ATTACK", false, false)],
      turn: 2,
      startingPlayerId: "p2",
    });
    expect(result).toBe(false);
  });

  it("auto-pasa en el turno 1 del jugador inicial aunque tenga entidades en ATTACK (no puede atacar)", () => {
    const result = canAutoAdvanceBattle({
      phase: "BATTLE",
      winnerPlayerId: null,
      isAnimating: false,
      isPlayerTurn: true,
      pendingTurnActionPlayerId: null,
      playerId: "p1",
      activeEntities: [createEntity("ATTACK", false, true), createEntity("ATTACK", false, true)],
      turn: 1,
      startingPlayerId: "p1",
    });
    expect(result).toBe(true);
  });

  it("NO auto-pasa en el turno 1 si el jugador NO es el inicial (sí puede atacar)", () => {
    const result = canAutoAdvanceBattle({
      phase: "BATTLE",
      winnerPlayerId: null,
      isAnimating: false,
      isPlayerTurn: true,
      pendingTurnActionPlayerId: null,
      playerId: "p1",
      activeEntities: [createEntity("ATTACK", false, false)],
      turn: 1,
      startingPlayerId: "p2",
    });
    expect(result).toBe(false);
  });

  it("muestra aviso de salto de combate cuando aún hay acciones", () => {
    const warning = shouldShowAdvanceWarning({ phase: "BATTLE", hasAvailableBattleActions: true, hasPlayableMainActions: false });
    expect(warning).toBe("BATTLE_SKIP_ATTACKS");
  });

  it("canPlayerDeclareAttacks: el jugador inicial no puede atacar en el turno 1", () => {
    expect(canPlayerDeclareAttacks(1, "p1", "p1")).toBe(false);
    expect(canPlayerDeclareAttacks(1, "p2", "p1")).toBe(true);
    expect(canPlayerDeclareAttacks(2, "p1", "p1")).toBe(true);
  });
});
