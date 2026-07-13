// src/core/use-cases/game-engine/state/summon-rules.test.ts - Regla de invocación normal + extra.
import { describe, expect, it } from "vitest";
import { canNormalSummon } from "./summon-rules";

describe("canNormalSummon", () => {
  it("permite invocar si aún no se ha invocado este turno", () => {
    expect(canNormalSummon({ hasNormalSummonedThisTurn: false })).toBe(true);
  });

  it("bloquea si ya se invocó y no hay invocaciones extra", () => {
    expect(canNormalSummon({ hasNormalSummonedThisTurn: true })).toBe(false);
    expect(canNormalSummon({ hasNormalSummonedThisTurn: true, extraSummonsThisTurn: 0 })).toBe(false);
  });

  it("permite invocar de nuevo si quedan invocaciones extra", () => {
    expect(canNormalSummon({ hasNormalSummonedThisTurn: true, extraSummonsThisTurn: 1 })).toBe(true);
  });
});
