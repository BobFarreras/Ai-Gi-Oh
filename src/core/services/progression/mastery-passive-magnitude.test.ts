// src/core/services/progression/mastery-passive-magnitude.test.ts - Pruebas del resolver de magnitud de pasivas escalado por versión.
import { describe, expect, it } from "vitest";
import { MASTERY_PASSIVE_IDS } from "./mastery-passive-ids";
import { resolveAttackGrowthCap, resolvePassiveMagnitude } from "./mastery-passive-magnitude";

describe("resolvePassiveMagnitude", () => {
  it("devuelve el valor pleno a V5 y el reducido por debajo", () => {
    expect(resolvePassiveMagnitude(MASTERY_PASSIVE_IDS.REFLECT_DAMAGE, 5)).toBe(200);
    expect(resolvePassiveMagnitude(MASTERY_PASSIVE_IDS.REFLECT_DAMAGE, 2)).toBe(100);
    expect(resolvePassiveMagnitude(MASTERY_PASSIVE_IDS.REFLECT_DAMAGE, undefined)).toBe(100);
  });

  it("trata las pasivas binarias con el mismo valor en cualquier versión", () => {
    expect(resolvePassiveMagnitude(MASTERY_PASSIVE_IDS.ENERGY_ON_DEATH, 1)).toBe(1);
    expect(resolvePassiveMagnitude(MASTERY_PASSIVE_IDS.ENERGY_ON_DEATH, 5)).toBe(1);
  });

  it("devuelve 0 ante pasiva nula o desconocida", () => {
    expect(resolvePassiveMagnitude(null, 5)).toBe(0);
    expect(resolvePassiveMagnitude("passive-inexistente", 5)).toBe(0);
  });

  it("calcula el tope de crecimiento proporcional (5x el paso)", () => {
    expect(resolveAttackGrowthCap(5)).toBe(500);
    expect(resolveAttackGrowthCap(1)).toBe(250);
  });
});
