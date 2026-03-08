// src/core/services/turn/turn-decision.test.ts - Pruebas unitarias de decisiones de auto-pase y avisos de avance de fase.
import { IBoardEntity } from "@/core/entities/IPlayer";
import { canAutoAdvanceBattle, hasAvailableBattleActions, shouldShowAdvanceWarning } from "./turn-decision";

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
    });
    expect(result).toBe(false);
  });

  it("muestra aviso de salto de combate cuando aún hay acciones", () => {
    const warning = shouldShowAdvanceWarning({ phase: "BATTLE", hasAvailableBattleActions: true, hasPlayableMainActions: false });
    expect(warning).toBe("BATTLE_SKIP_ATTACKS");
  });
});
