// src/core/use-cases/game-engine/combat/defense-can-attack-status.integration.test.ts - Ficha 7: "Escudo
// Firewall Ofensivo". Verifica que, con el estado activo, una entidad en DEFENSA puede atacar usando su DEF, y
// que sin el estado no puede.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { IActiveStatusEffect } from "@/core/entities/IStatusEffect";
import { GameEngine } from "@/core/use-cases/GameEngine";
import { createTestBoardEntity, createTestGameState } from "@/core/use-cases/game-engine/test-support/state-fixtures";

const shieldMagic: ICard = {
  id: "exec-escudo-firewall-ofensivo",
  name: "Escudo Firewall Ofensivo",
  description: "",
  type: "EXECUTION",
  faction: "NEUTRAL",
  cost: 2,
  effect: { action: "ALLOW_DEFENSE_MODE_ATTACK" },
};

// ATK bajo (100) y DEF alto (900): así se distingue con qué stat ataca.
const wall: ICard = {
  id: "entity-wall",
  name: "Muro",
  description: "",
  type: "ENTITY",
  faction: "NEUTRAL",
  cost: 3,
  attack: 100,
  defense: 900,
};

function battleWithDefender(status?: IActiveStatusEffect) {
  return createTestGameState({
    activePlayerId: "p1",
    startingPlayerId: "p2",
    turn: 4,
    phase: "BATTLE",
    activeStatusEffects: status ? [status] : [],
    playerA: { activeEntities: [createTestBoardEntity("atk", wall, "DEFENSE")] },
  });
}

const activeStatus: IActiveStatusEffect = { id: "DEFENSE_CAN_ATTACK-p1-1", kind: "DEFENSE_CAN_ATTACK", targetPlayerId: "p1", remainingTurns: 1 };

describe("Escudo Firewall Ofensivo (atacar desde defensa)", () => {
  it("al activar la magia aplica el estado al PROPIO jugador", () => {
    const state = createTestGameState({
      activePlayerId: "p1",
      phase: "MAIN_1",
      playerA: { activeExecutions: [createTestBoardEntity("exec-1", shieldMagic, "ACTIVATE")] },
    });
    const next = GameEngine.resolveExecution(state, "p1", "exec-1");
    expect(next.activeStatusEffects?.[0]).toMatchObject({ kind: "DEFENSE_CAN_ATTACK", targetPlayerId: "p1", remainingTurns: 1 });
  });

  it("con el estado activo, una defensora ataca directo usando su DEF (900), no su ATK (100)", () => {
    const state = battleWithDefender(activeStatus);
    const next = GameEngine.executeAttack(state, "p1", "atk");
    expect(state.playerB.healthPoints - next.playerB.healthPoints).toBe(900);
  });

  it("sin el estado, una defensora NO puede atacar", () => {
    expect(() => GameEngine.executeAttack(battleWithDefender(), "p1", "atk")).toThrow("modo ATAQUE");
  });

  it("el estado expira al terminar el turno del jugador (no persiste)", () => {
    const next = GameEngine.nextPhase(battleWithDefender(activeStatus));
    expect((next.activeStatusEffects ?? []).length).toBe(0);
  });
});
