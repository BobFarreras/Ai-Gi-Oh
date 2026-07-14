// src/core/use-cases/game-engine/state/status-effects.test.ts - Reglas puras de los efectos de estado.
import { describe, expect, it } from "vitest";
import { IActiveStatusEffect } from "@/core/entities/IStatusEffect";
import { addStatusEffects, applyStatusEffectsAtTurnStart, isDirectAttackBlocked, tickStatusEffectsOnTurnEnd } from "./status-effects";

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

  it("addStatusEffects conserva la magnitud del DoT/HoT", () => {
    const result = addStatusEffects([], [{ kind: "DAMAGE_OVER_TIME", targetPlayerId: "p1", remainingTurns: null, magnitude: 300 }], 5);
    expect(result).toEqual([{ id: "DAMAGE_OVER_TIME-p1-5", kind: "DAMAGE_OVER_TIME", targetPlayerId: "p1", remainingTurns: null, magnitude: 300 }]);
  });

  it("applyStatusEffectsAtTurnStart aplica daño (mín 0) y curación (tope maxHealth) al jugador objetivo", () => {
    const effects: IActiveStatusEffect[] = [
      { id: "d", kind: "DAMAGE_OVER_TIME", targetPlayerId: "p1", remainingTurns: null, magnitude: 300 },
      { id: "h", kind: "HEAL_OVER_TIME", targetPlayerId: "p2", remainingTurns: null, magnitude: 300 },
    ];
    expect(applyStatusEffectsAtTurnStart(effects, "p1", 1000, 8000)).toEqual({ healthPoints: 700, damageApplied: 300, healApplied: 0 });
    expect(applyStatusEffectsAtTurnStart(effects, "p1", 200, 8000)).toEqual({ healthPoints: 0, damageApplied: 200, healApplied: 0 });
    expect(applyStatusEffectsAtTurnStart(effects, "p2", 7900, 8000)).toEqual({ healthPoints: 8000, damageApplied: 0, healApplied: 100 });
  });

  it("applyStatusEffectsAtTurnStart ignora estados de otros jugadores y sin magnitud", () => {
    const effects: IActiveStatusEffect[] = [
      { id: "n", kind: "NO_DIRECT_ATTACKS", targetPlayerId: "p1", remainingTurns: 2 },
      { id: "d", kind: "DAMAGE_OVER_TIME", targetPlayerId: "p2", remainingTurns: null, magnitude: 300 },
    ];
    expect(applyStatusEffectsAtTurnStart(effects, "p1", 5000, 8000)).toEqual({ healthPoints: 5000, damageApplied: 0, healApplied: 0 });
  });
});
