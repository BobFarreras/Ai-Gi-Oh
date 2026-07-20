// src/components/game/board/multiplayer/animate-remote-action.reactive-trap.test.ts - Flujo de cliente del
// carrusel de trampa reactiva en multi (ficha 4): el DEFENSOR elige al recibir el ataque diferido y emite la
// resolución; el ATACANTE la recibe, revela la trampa activada y desbloquea. Mock del emisor y de la decisión.
import { describe, expect, it, vi } from "vitest";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import { createTestBoardEntity } from "@/core/use-cases/game-engine/test-support/state-fixtures";
import {
  attackerCard,
  createTrapBaseState,
  createTrapEntity,
  trapNegateAttack,
  trapOnAttack,
} from "@/core/use-cases/game-engine/effects/trap-triggers.test-fixtures";
import { animateRemoteAction, IRemoteAnimationContext } from "./animate-remote-action";

/** Contexto de animación con estado mutable: `getState`/`applyTransition` comparten `current`. */
function createContext(initial: GameState, overrides: Partial<IRemoteAnimationContext> = {}) {
  let current = initial;
  const emitLocalAction = vi.fn();
  const setIsAnimating = vi.fn();
  const setRevealedEntities = vi.fn();
  const ctx: IRemoteAnimationContext = {
    getState: () => current,
    applyTransition: vi.fn((transition) => {
      current = transition(current);
      return current;
    }),
    setIsAnimating,
    setActiveAttackerId: vi.fn(),
    setRevealedEntities,
    clearSelection: vi.fn(),
    clearError: vi.fn(),
    reportDesync: vi.fn(),
    requestReactiveTrapDecision: vi.fn(async () => ({ activate: true, chosenTrapInstanceId: "t1" })),
    emitLocalAction,
    ...overrides,
  };
  return { ctx, getCurrent: () => current, emitLocalAction, setIsAnimating, setRevealedEntities };
}

/** DEFENSOR local (playerA, p1) con dos trampas; ATACANTE remoto (playerB, p2). Turno del atacante. */
function defenderClientState(): GameState {
  const base = createTrapBaseState();
  return {
    ...base,
    activePlayerId: "p2",
    playerA: { ...base.playerA, activeExecutions: [createTrapEntity("t1", trapOnAttack), createTrapEntity("t2", trapNegateAttack)] },
    playerB: { ...base.playerB, activeEntities: [createTestBoardEntity("a1", attackerCard, "ATTACK")] },
  };
}

/** ATACANTE local (playerA, p1); DEFENSOR remoto (playerB, p2) con dos trampas. Turno del atacante. */
function attackerClientState(): GameState {
  const base = createTrapBaseState();
  return {
    ...base,
    playerA: { ...base.playerA, activeEntities: [createTestBoardEntity("a1", attackerCard, "ATTACK")] },
    playerB: { ...base.playerB, activeExecutions: [createTrapEntity("t1", trapOnAttack), createTrapEntity("t2", trapNegateAttack)] },
  };
}

describe("animateRemoteAction — trampa reactiva en multi (ficha 4)", () => {
  it("DEFENSOR: al recibir el ATTACK diferido, muestra el carrusel, aplica y EMITE la resolución elegida", async () => {
    const { ctx, getCurrent, emitLocalAction } = createContext(defenderClientState());

    await animateRemoteAction(ctx, "p2", {
      type: "ATTACK",
      payload: { attackerInstanceId: "a1", defenderInstanceId: undefined, deferReactiveTraps: true },
    });

    // Se le ofrecieron LAS DOS trampas elegibles (por instanceId de la pausa).
    expect(ctx.requestReactiveTrapDecision).toHaveBeenCalledTimes(1);
    const offered = (ctx.requestReactiveTrapDecision as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(offered.map((option: { instanceId: string }) => option.instanceId)).toEqual(["t1", "t2"]);
    // Emite RESOLVE_REACTIVE_TRAP con la elección para que el atacante converja.
    expect(emitLocalAction).toHaveBeenCalledTimes(1);
    expect(emitLocalAction.mock.calls[0][0]).toEqual({
      type: "RESOLVE_REACTIVE_TRAP",
      payload: { activate: true, chosenTrapInstanceId: "t1" },
    });
    // La pausa se resolvió localmente activando t1 (daño 500 al atacante playerB).
    const final = getCurrent();
    expect(final.pendingReactiveTrapDecision).toBeUndefined();
    expect(final.playerA.graveyard.map((card) => card.id)).toContain("trap-on-attack");
    expect(final.playerB.healthPoints).toBe(8000 - 500);
  });

  it("DEFENSOR: si pasa (o auto-pasa por timeout), emite 'pasar' y ninguna trampa se consume", async () => {
    const { ctx, getCurrent, emitLocalAction } = createContext(defenderClientState(), {
      requestReactiveTrapDecision: vi.fn(async () => ({ activate: false })),
    });

    await animateRemoteAction(ctx, "p2", {
      type: "ATTACK",
      payload: { attackerInstanceId: "a1", defenderInstanceId: undefined, deferReactiveTraps: true },
    });

    expect(emitLocalAction).toHaveBeenCalledTimes(1);
    expect(emitLocalAction.mock.calls[0][0]).toEqual({ type: "RESOLVE_REACTIVE_TRAP", payload: { activate: false, chosenTrapInstanceId: undefined } });
    const final = getCurrent();
    expect(final.pendingReactiveTrapDecision).toBeUndefined();
    // Ataque directo íntegro (1600) y ninguna trampa consumida.
    expect(final.playerA.healthPoints).toBe(8000 - 1600);
    expect(final.playerA.activeExecutions.map((execution) => execution.instanceId)).toEqual(["t1", "t2"]);
  });

  it("ATACANTE: al recibir RESOLVE_REACTIVE_TRAP, revela la trampa activada, resuelve y desbloquea", async () => {
    const paused = GameEngine.executeAttack(attackerClientState(), "p1", "a1", undefined, { deferReactiveTraps: true });
    expect(paused.pendingReactiveTrapDecision?.defenderPlayerId).toBe("p2");
    const { ctx, getCurrent, setIsAnimating, setRevealedEntities } = createContext(paused);

    await animateRemoteAction(ctx, "p2", {
      type: "RESOLVE_REACTIVE_TRAP",
      payload: { activate: true, chosenTrapInstanceId: "t1" },
    });

    // El atacante NO decide nada aquí (la decisión fue del defensor).
    expect(ctx.requestReactiveTrapDecision).not.toHaveBeenCalled();
    // Reveló y ocultó la trampa activada.
    expect(setRevealedEntities).toHaveBeenCalledTimes(2);
    const final = getCurrent();
    expect(final.pendingReactiveTrapDecision).toBeUndefined();
    expect(final.playerB.graveyard.map((card) => card.id)).toContain("trap-on-attack");
    // Se libera el bloqueo de "esperando al rival".
    expect(setIsAnimating).toHaveBeenCalledWith(false);
  });
});
