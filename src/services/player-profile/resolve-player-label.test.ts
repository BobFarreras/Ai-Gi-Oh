// src/services/player-profile/resolve-player-label.test.ts - Verifica prioridad y fallback seguro al resolver nombre visible de jugador.
import { describe, expect, it } from "vitest";
import { resolvePlayerLabel } from "@/services/player-profile/resolve-player-label";

describe("resolvePlayerLabel", () => {
  it("prioriza nickname persistido del perfil", () => {
    expect(resolvePlayerLabel({
      profileNickname: "NeoCommander",
      sessionDisplayName: "display",
      sessionEmail: "neo@aigi.io",
    })).toBe("NeoCommander");
  });

  it("usa displayName cuando no parece email", () => {
    expect(resolvePlayerLabel({
      profileNickname: "",
      sessionDisplayName: "OperatorZero",
      sessionEmail: "neo@aigi.io",
    })).toBe("OperatorZero");
  });

  it("cae a nickname derivado de email cuando displayName es email", () => {
    expect(resolvePlayerLabel({
      profileNickname: null,
      sessionDisplayName: "neo@aigi.io",
      sessionEmail: "neo@aigi.io",
    })).toBe("neo");
  });

  it("usa fallback cuando no hay datos válidos", () => {
    expect(resolvePlayerLabel({
      profileNickname: null,
      sessionDisplayName: null,
      sessionEmail: null,
      fallback: "Arquitecto",
    })).toBe("Arquitecto");
  });
});
