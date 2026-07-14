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

  it("devuelve null para pasiva desconocida (no afirma un poder que no sabe describir)", () => {
    expect(resolveMasteryPassiveLabel("unknown-passive-id")).toBeNull();
  });

  it("devuelve null cuando no hay pasiva", () => {
    expect(resolveMasteryPassiveLabel(null)).toBeNull();
  });

  it("escala la magnitud del texto según la versión (innata vs V5)", () => {
    expect(resolveMasteryPassiveLabel("passive-atk-drain-200", 1)).toContain("reduce 100 ATK");
    expect(resolveMasteryPassiveLabel("passive-atk-drain-200", 5)).toContain("reduce 200 ATK");
  });
});
