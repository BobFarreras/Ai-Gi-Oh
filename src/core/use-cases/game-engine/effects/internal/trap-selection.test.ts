// src/core/use-cases/game-engine/effects/internal/trap-selection.test.ts - Selección de la trampa reactiva
// (ficha 4): por defecto la primera elegible; con elección explícita, esa (revalidada); id inválido = ninguna.
import { describe, expect, it } from "vitest";
import { ICard, TrapTrigger } from "@/core/entities/ICard";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { createTestBoardEntity, createTestGameState } from "@/core/use-cases/game-engine/test-support/state-fixtures";
import { findTriggeredTraps, selectTriggeredTrap } from "./trap-selection";

const TRIGGER: TrapTrigger = "ON_OPPONENT_ATTACK_DECLARED";

function trapCard(id: string): ICard {
  return { id, name: id, description: "", type: "TRAP", faction: "NEUTRAL", cost: 2, trigger: TRIGGER, effect: { action: "NEGATE_ATTACK_AND_DESTROY_ATTACKER" } };
}

function setTrap(instanceId: string, cardId: string): IBoardEntity {
  return createTestBoardEntity(instanceId, trapCard(cardId), "SET");
}

function stateWithTraps(...traps: IBoardEntity[]) {
  // El jugador reactivo es playerB; el atacante playerA. La selección mira las trampas de playerB.
  return createTestGameState({ playerB: { activeExecutions: traps }, activePlayerId: "p1", phase: "BATTLE" });
}

describe("selección de trampa reactiva (ficha 4)", () => {
  it("findTriggeredTraps devuelve TODAS las elegibles en orden de colocación", () => {
    const state = stateWithTraps(setTrap("t1", "trap-a"), setTrap("t2", "trap-b"));
    const eligible = findTriggeredTraps(state.playerB, TRIGGER);
    expect(eligible.map((entity) => entity.instanceId)).toEqual(["t1", "t2"]);
  });

  it("sin elección devuelve la PRIMERA (criterio por defecto, el de la IA)", () => {
    const state = stateWithTraps(setTrap("t1", "trap-a"), setTrap("t2", "trap-b"));
    expect(selectTriggeredTrap(state, "p2", TRIGGER)?.trap.instanceId).toBe("t1");
  });

  it("con elección explícita devuelve ESA trampa (aunque no sea la primera)", () => {
    const state = stateWithTraps(setTrap("t1", "trap-a"), setTrap("t2", "trap-b"));
    expect(selectTriggeredTrap(state, "p2", TRIGGER, undefined, "t2")?.trap.instanceId).toBe("t2");
  });

  it("un id elegido que NO está entre las elegibles no activa ninguna (cliente modificado)", () => {
    const state = stateWithTraps(setTrap("t1", "trap-a"), setTrap("t2", "trap-b"));
    // Ni siquiera cae a la primera: el id falso simplemente no activa nada.
    expect(selectTriggeredTrap(state, "p2", TRIGGER, undefined, "no-existe")).toBeNull();
  });

  it("sin trampas elegibles devuelve null con o sin elección", () => {
    const state = stateWithTraps();
    expect(selectTriggeredTrap(state, "p2", TRIGGER)).toBeNull();
    expect(selectTriggeredTrap(state, "p2", TRIGGER, undefined, "t1")).toBeNull();
  });
});
