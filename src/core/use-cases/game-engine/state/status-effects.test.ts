// src/core/use-cases/game-engine/state/status-effects.test.ts - Reglas puras de los efectos de estado.
import { describe, expect, it } from "vitest";
import { IActiveStatusEffect } from "@/core/entities/IStatusEffect";
import { addStatusEffects, isDirectAttackBlocked, tickStatusEffectsOnTurnEnd } from "./status-effects";

const noDirect = (target: string, remaining: number | null, id = `NO_DIRECT_ATTACKS-${target}-1`): IActiveStatusEffect => ({
  id,
  kind: "NO_DIRECT_ATTACKS",
  targetPlayerId: target,
  remainingTurns: remaining,
});

describe("status-effects", () => {
  it("isDirectAttackBlocked detecta el estado del jugador correcto", () => {
    const effects = [noDirect("p2", 3)];
    expect(isDirectAttackBlocked(effects, "p2")).toBe(true);
    expect(isDirectAttackBlocked(effects, "p1")).toBe(false);
    expect(isDirectAttackBlocked(undefined, "p2")).toBe(false);
  });

  it("addStatusEffects inserta con id determinista y deduplica por tipo+jugador", () => {
    const first = addStatusEffects([], [{ kind: "NO_DIRECT_ATTACKS", targetPlayerId: "p2", remainingTurns: 3 }], 4);
    expect(first).toEqual([{ id: "NO_DIRECT_ATTACKS-p2-4", kind: "NO_DIRECT_ATTACKS", targetPlayerId: "p2", remainingTurns: 3 }]);
    // Re-aplicar sobre el mismo jugador refresca (no acumula duplicados).
    const refreshed = addStatusEffects(first, [{ kind: "NO_DIRECT_ATTACKS", targetPlayerId: "p2", remainingTurns: 2 }], 6);
    expect(refreshed).toHaveLength(1);
    expect(refreshed[0].remainingTurns).toBe(2);
  });

  it("tickStatusEffectsOnTurnEnd descuenta solo al jugador saliente y purga al llegar a 0", () => {
    const effects = [noDirect("p1", 2), noDirect("p2", 1)];
    const afterP1 = tickStatusEffectsOnTurnEnd(effects, "p1");
    expect(afterP1.find((status) => status.targetPlayerId === "p1")?.remainingTurns).toBe(1);
    expect(afterP1.find((status) => status.targetPlayerId === "p2")?.remainingTurns).toBe(1); // intacto
    const afterP2 = tickStatusEffectsOnTurnEnd(effects, "p2");
    expect(afterP2.some((status) => status.targetPlayerId === "p2")).toBe(false); // purgado (1→0)
  });

  it("los estados de duración null no expiran", () => {
    const effects = [noDirect("p1", null)];
    expect(tickStatusEffectsOnTurnEnd(effects, "p1")).toEqual(effects);
  });
});
