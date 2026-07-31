// src/core/services/survival/resolve-issued-battle-disposition.test.ts - Fija la política de reanudar, castigar o reemitir una batalla pendiente.
import { describe, expect, it } from "vitest";
import { GameState } from "@/core/use-cases/GameEngine";
import { resolveIssuedBattleDisposition } from "./resolve-issued-battle-disposition";

const CURRENT_PROTOCOL = 2;
const NOW_ISO = "2026-08-01T12:00:00.000Z";
const currentSnapshot = {
  playerA: { hand: [{}, {}, {}, {}] },
  playerB: { hand: [{}, {}, {}, {}] },
} as GameState;

function build(overrides: Parameters<typeof resolveIssuedBattleDisposition>[0]) {
  return resolveIssuedBattleDisposition(overrides);
}

describe("resolveIssuedBattleDisposition", () => {
  it("reanuda una sesión vigente con el contrato de apertura actual", () => {
    expect(build({
      session: { protocolVersion: CURRENT_PROTOCOL, expiresAtIso: "2026-08-01T12:30:00.000Z" },
      snapshot: currentSnapshot,
      nowIso: NOW_ISO,
      expectedProtocolVersion: CURRENT_PROTOCOL,
    })).toBe("RESUME");
  });

  it("castiga como abandono una sesión caducada que sí era jugable", () => {
    expect(build({
      session: { protocolVersion: CURRENT_PROTOCOL, expiresAtIso: "2026-08-01T11:59:59.000Z" },
      snapshot: currentSnapshot,
      nowIso: NOW_ISO,
      expectedProtocolVersion: CURRENT_PROTOCOL,
    })).toBe("FORFEIT");
  });

  it("reemite sin castigo cuando el snapshot es incompatible, aunque haya caducado", () => {
    const staleSnapshot = {
      playerA: { hand: [{}, {}, {}] },
      playerB: { hand: [{}, {}, {}] },
    } as GameState;
    expect(build({
      session: { protocolVersion: CURRENT_PROTOCOL, expiresAtIso: "2026-08-01T11:00:00.000Z" },
      snapshot: staleSnapshot,
      nowIso: NOW_ISO,
      expectedProtocolVersion: CURRENT_PROTOCOL,
    })).toBe("REISSUE");
  });

  it("reemite sin castigo cuando la versión de protocolo quedó obsoleta", () => {
    expect(build({
      session: { protocolVersion: CURRENT_PROTOCOL - 1, expiresAtIso: "2026-08-01T12:30:00.000Z" },
      snapshot: currentSnapshot,
      nowIso: NOW_ISO,
      expectedProtocolVersion: CURRENT_PROTOCOL,
    })).toBe("REISSUE");
  });

  it("reemite sin castigo cuando la sesión no está disponible", () => {
    expect(build({
      session: null,
      snapshot: null,
      nowIso: NOW_ISO,
      expectedProtocolVersion: CURRENT_PROTOCOL,
    })).toBe("REISSUE");
  });

  it("reemite sin castigo si la ventana temporal persistida es ilegible", () => {
    expect(build({
      session: { protocolVersion: CURRENT_PROTOCOL, expiresAtIso: "no-es-una-fecha" },
      snapshot: currentSnapshot,
      nowIso: NOW_ISO,
      expectedProtocolVersion: CURRENT_PROTOCOL,
    })).toBe("REISSUE");
  });
});
