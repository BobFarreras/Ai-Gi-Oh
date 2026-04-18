// src/services/player-profile/resolve-default-nickname-from-email.test.ts - Comprueba resolución de nickname inicial desde email.
import { describe, expect, it } from "vitest";
import { resolveDefaultNicknameFromEmail } from "@/services/player-profile/resolve-default-nickname-from-email";

describe("resolveDefaultNicknameFromEmail", () => {
  it("usa prefijo de email cuando es válido", () => {
    expect(resolveDefaultNicknameFromEmail("neo@aigi.io")).toBe("neo");
  });

  it("cae en fallback cuando email no existe o no es válido", () => {
    expect(resolveDefaultNicknameFromEmail(null)).toBe("Operador");
    expect(resolveDefaultNicknameFromEmail("ab@aigi.io")).toBe("Operador");
  });
});

