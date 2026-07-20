// src/core/services/multiplayer/apply-match-action.test.ts - Verifica el diferido/decisión de trampa reactiva
// (ficha 4) a nivel de transporte multi: ambos clientes aplican la MISMA secuencia de acciones y convergen.
import { describe, expect, it } from "vitest";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import { applyMatchAction } from "@/core/services/multiplayer/apply-match-action";
import { createTestBoardEntity } from "@/core/use-cases/game-engine/test-support/state-fixtures";
import {
  attackerCard,
  createTrapBaseState,
  createTrapEntity,
  trapNegateAttack,
  trapOnAttack,
} from "@/core/use-cases/game-engine/effects/trap-triggers.test-fixtures";

function stateWithTwoDefenderTraps(): GameState {
  const base = createTrapBaseState();
  return {
    ...base,
    playerA: { ...base.playerA, activeEntities: [createTestBoardEntity("a1", attackerCard, "ATTACK")] },
    playerB: { ...base.playerB, activeExecutions: [createTrapEntity("t1", trapOnAttack), createTrapEntity("t2", trapNegateAttack)] },
  };
}

describe("applyMatchAction — trampa reactiva diferida (ficha 4 multi)", () => {
  it("ATTACK con deferReactiveTraps pausa; RESOLVE_REACTIVE_TRAP la continúa igual en ambos clientes", () => {
    // Simulamos los dos clientes aplicando la MISMA secuencia de acciones sobre el mismo estado inicial.
    const applySequence = () => {
      let state = stateWithTwoDefenderTraps();
      state = applyMatchAction(state, "p1", { type: "ATTACK", payload: { attackerInstanceId: "a1", deferReactiveTraps: true } });
      expect(state.pendingReactiveTrapDecision?.defenderPlayerId).toBe("p2");
      // El defensor (p2) elige la trampa de negar+destruir.
      state = applyMatchAction(state, "p2", { type: "RESOLVE_REACTIVE_TRAP", payload: { activate: true, chosenTrapInstanceId: "t2" } });
      return state;
    };
    const clientA = applySequence();
    const clientB = applySequence();
    // Determinismo: ambos clientes convergen y coinciden con el ataque directo con esa elección.
    const direct = GameEngine.executeAttack(stateWithTwoDefenderTraps(), "p1", "a1", undefined, { chosenTrapInstanceId: "t2" });
    expect(clientA.playerA.activeEntities).toEqual(clientB.playerA.activeEntities);
    expect(clientA.playerA.activeEntities).toHaveLength(0); // atacante destruido por la trampa elegida
    expect(clientA.playerA.healthPoints).toBe(direct.playerA.healthPoints);
    expect(clientA.pendingReactiveTrapDecision).toBeUndefined();
  });

  it("PASAR: el defensor no activa ninguna trampa y el ataque directo resuelve íntegro", () => {
    let state = stateWithTwoDefenderTraps();
    state = applyMatchAction(state, "p1", { type: "ATTACK", payload: { attackerInstanceId: "a1", deferReactiveTraps: true } });
    state = applyMatchAction(state, "p2", { type: "RESOLVE_REACTIVE_TRAP", payload: { activate: false } });
    expect(state.playerB.healthPoints).toBe(8000 - 1600);
    expect(state.playerB.activeExecutions).toHaveLength(2);
  });

  it("seguridad: si el ATACANTE intenta resolver la trampa del defensor, el motor lo rechaza", () => {
    let state = stateWithTwoDefenderTraps();
    state = applyMatchAction(state, "p1", { type: "ATTACK", payload: { attackerInstanceId: "a1", deferReactiveTraps: true } });
    // p1 (atacante) no es el defensor de la pausa → rechazado.
    expect(() => applyMatchAction(state, "p1", { type: "RESOLVE_REACTIVE_TRAP", payload: { activate: true, chosenTrapInstanceId: "t2" } })).toThrow();
  });

  it("sin deferReactiveTraps, ATTACK resuelve como siempre (multi actual intacto)", () => {
    const state = applyMatchAction(stateWithTwoDefenderTraps(), "p1", { type: "ATTACK", payload: { attackerInstanceId: "a1" } });
    expect(state.pendingReactiveTrapDecision).toBeUndefined();
    // La primera elegible (criterio por defecto) se activó.
    expect(state.playerB.graveyard.map((card) => card.id)).toContain("trap-on-attack");
  });
});
