// src/services/survival/get-survival-starting-lp.test.ts - Verifica el máximo persistente aportado por habilidades.
import { describe, expect, it } from "vitest";
import { resolveSurvivalStartingLp } from "./get-survival-starting-lp";

describe("resolveSurvivalStartingLp", () => {
  it("suma el bonus de LP del árbol al máximo base", () => {
    expect(resolveSurvivalStartingLp(8000, 500)).toBe(8500);
  });

  it("normaliza bonus negativos o fraccionarios", () => {
    expect(resolveSurvivalStartingLp(8000, -100)).toBe(8000);
    expect(resolveSurvivalStartingLp(8000, 300.9)).toBe(8300);
  });
});
