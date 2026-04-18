// src/app/api/player/profile/internal/read-player-profile-payload.test.ts - Verifica validaciones de payload en actualización de perfil.
import { describe, expect, it } from "vitest";
import { readPlayerProfileUpdatePayload } from "./read-player-profile-payload";

describe("readPlayerProfileUpdatePayload", () => {
  it("acepta nickname válido con estrategia por defecto", () => {
    expect(readPlayerProfileUpdatePayload({ nickname: "NeoOperator" })).toEqual({
      nickname: "NeoOperator",
      strategy: "force",
    });
  });

  it("acepta estrategia bootstrap_if_default", () => {
    expect(readPlayerProfileUpdatePayload({ nickname: "NeoOperator", strategy: "bootstrap_if_default" })).toEqual({
      nickname: "NeoOperator",
      strategy: "bootstrap_if_default",
    });
  });

  it("falla cuando nickname es demasiado corto", () => {
    expect(() => readPlayerProfileUpdatePayload({ nickname: "ab" })).toThrow("entre 3 y 24");
  });
});

