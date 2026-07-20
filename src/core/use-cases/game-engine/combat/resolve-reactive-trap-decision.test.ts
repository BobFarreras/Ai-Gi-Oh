// src/core/use-cases/game-engine/combat/resolve-reactive-trap-decision.test.ts - Verifica el diferido/elección
// de trampa reactiva del defensor (ficha 4, multi): pausa determinista, revalidación y equivalencia con el ataque directo.
import { describe, expect, it } from "vitest";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import { createTestBoardEntity } from "@/core/use-cases/game-engine/test-support/state-fixtures";
import {
  attackerCard,
  createTrapBaseState,
  createTrapEntity,
  trapNegateAttack,
  trapOnAttack,
} from "@/core/use-cases/game-engine/effects/trap-triggers.test-fixtures";

/** p1 ataca directo; p2 (defensor) tiene DOS trampas elegibles ON_OPPONENT_ATTACK_DECLARED: t1 (daño 500) y t2 (negar+destruir). */
function stateWithTwoDefenderTraps(): GameState {
  const base = createTrapBaseState();
  return {
    ...base,
    playerA: { ...base.playerA, activeEntities: [createTestBoardEntity("a1", attackerCard, "ATTACK")] },
    playerB: { ...base.playerB, activeExecutions: [createTrapEntity("t1", trapOnAttack), createTrapEntity("t2", trapNegateAttack)] },
  };
}

/** Campos con significado de juego para comparar equivalencia (evita depender del orden interno del log). */
function meaningfulShape(state: GameState) {
  return {
    aHp: state.playerA.healthPoints,
    bHp: state.playerB.healthPoints,
    aEntities: state.playerA.activeEntities.map((entity) => entity.instanceId),
    aDestroyed: (state.playerA.destroyedPile ?? []).map((card) => card.id),
    bExecutions: state.playerB.activeExecutions.map((entity) => entity.instanceId),
    bGraveyard: state.playerB.graveyard.map((card) => card.id),
  };
}

describe("resolveReactiveTrapDecision (ficha 4 multi)", () => {
  it("deferReactiveTraps PAUSA el ataque sin resolverlo cuando el defensor tiene trampas elegibles", () => {
    const paused = GameEngine.executeAttack(stateWithTwoDefenderTraps(), "p1", "a1", undefined, { deferReactiveTraps: true });
    expect(paused.pendingReactiveTrapDecision).toBeTruthy();
    expect(paused.pendingReactiveTrapDecision?.defenderPlayerId).toBe("p2");
    expect(paused.pendingReactiveTrapDecision?.isDirectAttack).toBe(true);
    expect(paused.pendingReactiveTrapDecision?.eligibleTrapInstanceIds).toEqual(["t1", "t2"]);
    // Nada se ha resuelto: sin daño, atacante sin marcar, trampas intactas.
    expect(paused.playerB.healthPoints).toBe(8000);
    expect(paused.playerA.activeEntities.find((entity) => entity.instanceId === "a1")?.hasAttackedThisTurn).toBe(false);
    expect(paused.playerB.activeExecutions).toHaveLength(2);
  });

  it("elegir la SEGUNDA trampa (negar+destruir) produce el MISMO estado que el ataque directo con esa elección (determinista)", () => {
    const paused = GameEngine.executeAttack(stateWithTwoDefenderTraps(), "p1", "a1", undefined, { deferReactiveTraps: true });
    const resolved = GameEngine.resolveReactiveTrapDecision(paused, "p2", { activate: true, chosenTrapInstanceId: "t2" });
    const direct = GameEngine.executeAttack(stateWithTwoDefenderTraps(), "p1", "a1", undefined, { chosenTrapInstanceId: "t2" });
    expect(meaningfulShape(resolved)).toEqual(meaningfulShape(direct));
    // Y de hecho activó la de negar+destruir: el atacante muere, no la primera (daño).
    expect(resolved.playerA.activeEntities).toHaveLength(0);
    expect(resolved.pendingReactiveTrapDecision).toBeUndefined();
  });

  it("elegir la PRIMERA trampa activa esa y no la segunda (no 'cae' a otra)", () => {
    const paused = GameEngine.executeAttack(stateWithTwoDefenderTraps(), "p1", "a1", undefined, { deferReactiveTraps: true });
    const resolved = GameEngine.resolveReactiveTrapDecision(paused, "p2", { activate: true, chosenTrapInstanceId: "t1" });
    // t1 es daño (no destruye): el atacante sobrevive; t1 al cementerio, t2 sigue puesta.
    expect(resolved.playerA.activeEntities.some((entity) => entity.instanceId === "a1")).toBe(true);
    expect(resolved.playerB.graveyard.map((card) => card.id)).toContain("trap-on-attack");
    expect(resolved.playerB.activeExecutions.some((entity) => entity.instanceId === "t2")).toBe(true);
  });

  it("PASAR (activate:false) resuelve el ataque sin activar ninguna trampa (ambas siguen puestas)", () => {
    const paused = GameEngine.executeAttack(stateWithTwoDefenderTraps(), "p1", "a1", undefined, { deferReactiveTraps: true });
    const resolved = GameEngine.resolveReactiveTrapDecision(paused, "p2", { activate: false });
    // Ataque directo íntegro (1600) y ninguna trampa consumida.
    expect(resolved.playerB.healthPoints).toBe(8000 - 1600);
    expect(resolved.playerB.activeExecutions.map((entity) => entity.instanceId)).toEqual(["t1", "t2"]);
    expect(resolved.playerB.graveyard).toHaveLength(0);
  });

  it("un chosenTrapInstanceId inexistente (cliente manipulado) NO activa ninguna trampa", () => {
    const paused = GameEngine.executeAttack(stateWithTwoDefenderTraps(), "p1", "a1", undefined, { deferReactiveTraps: true });
    const resolved = GameEngine.resolveReactiveTrapDecision(paused, "p2", { activate: true, chosenTrapInstanceId: "no-existe" });
    expect(resolved.playerB.healthPoints).toBe(8000 - 1600);
    expect(resolved.playerB.activeExecutions).toHaveLength(2);
  });

  it("deferReactiveTraps SIN trampas elegibles resuelve el ataque en el sitio (no pausa)", () => {
    const base = createTrapBaseState();
    const state: GameState = { ...base, playerA: { ...base.playerA, activeEntities: [createTestBoardEntity("a1", attackerCard, "ATTACK")] } };
    const next = GameEngine.executeAttack(state, "p1", "a1", undefined, { deferReactiveTraps: true });
    expect(next.pendingReactiveTrapDecision).toBeUndefined();
    expect(next.playerB.healthPoints).toBe(8000 - 1600);
  });

  it("single-player intacto: sin el flag, el ataque resuelve inline y no deja pausa", () => {
    const next = GameEngine.executeAttack(stateWithTwoDefenderTraps(), "p1", "a1");
    expect(next.pendingReactiveTrapDecision).toBeUndefined();
    // La primera elegible (criterio por defecto) se activó.
    expect(next.playerB.graveyard.map((card) => card.id)).toContain("trap-on-attack");
  });

  it("rechaza resolver sin pausa pendiente o por un jugador que no es el defensor", () => {
    const paused = GameEngine.executeAttack(stateWithTwoDefenderTraps(), "p1", "a1", undefined, { deferReactiveTraps: true });
    expect(() => GameEngine.resolveReactiveTrapDecision(stateWithTwoDefenderTraps(), "p2", { activate: false })).toThrow();
    expect(() => GameEngine.resolveReactiveTrapDecision(paused, "p1", { activate: false })).toThrow();
  });
});
