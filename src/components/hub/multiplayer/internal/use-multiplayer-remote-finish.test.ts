// src/components/hub/multiplayer/internal/use-multiplayer-remote-finish.test.ts - Tests puros de la traducción de outcome remoto.
import { describe, it, expect } from "vitest";
import { resolveRemoteOutcome } from "./use-multiplayer-remote-finish";

describe("resolveRemoteOutcome", () => {
  it("devuelve WIN si winnerId es el jugador local", () => {
    expect(resolveRemoteOutcome("player-a", "player-a")).toBe("WIN");
  });

  it("devuelve LOSE si winnerId es el rival", () => {
    expect(resolveRemoteOutcome("player-b", "player-a")).toBe("LOSE");
  });

  it("devuelve DRAW si winnerId es null (empate)", () => {
    expect(resolveRemoteOutcome(null, "player-a")).toBe("DRAW");
  });

  it("es simétrico: el rival también recibe su outcome correcto", () => {
    expect(resolveRemoteOutcome("player-a", "player-b")).toBe("LOSE");
    expect(resolveRemoteOutcome("player-b", "player-b")).toBe("WIN");
  });
});
