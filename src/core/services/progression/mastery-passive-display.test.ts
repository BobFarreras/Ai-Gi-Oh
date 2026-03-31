// src/core/services/progression/mastery-passive-display.test.ts - Pruebas de resolución de textos de pasiva mastery para UI.
import { describe, expect, it } from "vitest";
import { resolveMasteryPassiveLabel } from "./mastery-passive-display";

describe("mastery-passive-display", () => {
  it("resuelve una pasiva conocida", () => {
    expect(resolveMasteryPassiveLabel("passive-atk-drain-200")).toContain("reduce 200 ATK");
  });

  it("resuelve la pasiva ofensiva de energía para V5", () => {
    expect(resolveMasteryPassiveLabel("passive-attack-energy-plus-1")).toContain("en ataque");
  });

  it("devuelve fallback para pasiva desconocida", () => {
    expect(resolveMasteryPassiveLabel("unknown-passive-id")).toBe("Pasiva Mastery activa en esta carta.");
  });
});
