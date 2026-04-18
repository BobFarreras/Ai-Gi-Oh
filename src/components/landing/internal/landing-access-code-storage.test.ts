// src/components/landing/internal/landing-access-code-storage.test.ts - Verifica normalización y límites del access code persistido.
import { describe, expect, it } from "vitest";
import { normalizeLandingAccessCode } from "@/components/landing/internal/landing-access-code-storage";

describe("normalizeLandingAccessCode", () => {
  it("normaliza valor válido con trim", () => {
    expect(normalizeLandingAccessCode("  Neo_Operator  ")).toBe("Neo_Operator");
  });

  it("devuelve null si no cumple longitud mínima", () => {
    expect(normalizeLandingAccessCode("ab")).toBeNull();
  });
});

