// src/core/use-cases/game-engine/effects/internal/trap-trigger-registry.test.ts - Verifica mapping de eventos reactivos a triggers concretos de trampa.
import { describe, expect, it, vi } from "vitest";

const { resolveTrapTriggerMock } = vi.hoisted(() => ({ resolveTrapTriggerMock: vi.fn((state: unknown) => state) }));
vi.mock("@/core/use-cases/game-engine/effects/resolve-trap-trigger", () => ({ resolveTrapTrigger: resolveTrapTriggerMock }));

import { getRegisteredTrapReactiveEvents, resolveReactiveTrapEvent } from "@/core/use-cases/game-engine/effects/internal/trap-trigger-registry";

describe("trap-trigger-registry", () => {
  it("expone eventos reactivos registrados", () => {
    expect(getRegisteredTrapReactiveEvents()).toEqual(["ATTACK_DECLARED", "DIRECT_ATTACK_DECLARED", "ENTITY_SET_PLAYED", "EXECUTION_BUFF_APPLIED", "EXECUTION_ACTIVATED", "TRAP_ACTIVATED"]);
  });

  it("mapea ATTACK_DECLARED al trigger de ataque con contexto", () => {
    const state = { turn: 1 };
    resolveReactiveTrapEvent(state as never, "player-b", { type: "ATTACK_DECLARED", context: { attackerPlayerId: "player-a", attackerInstanceId: "entity-1" } });
    expect(resolveTrapTriggerMock).toHaveBeenCalledWith(state, "player-b", "ON_OPPONENT_ATTACK_DECLARED", { attackerPlayerId: "player-a", attackerInstanceId: "entity-1" });
  });

  it("mapea DIRECT_ATTACK_DECLARED al trigger dedicado", () => {
    const state = { turn: 1 };
    resolveReactiveTrapEvent(state as never, "player-b", { type: "DIRECT_ATTACK_DECLARED", context: { attackerPlayerId: "player-a", attackerInstanceId: "entity-1" } });
    expect(resolveTrapTriggerMock).toHaveBeenCalledWith(state, "player-b", "ON_OPPONENT_DIRECT_ATTACK_DECLARED", { attackerPlayerId: "player-a", attackerInstanceId: "entity-1" });
  });
});
