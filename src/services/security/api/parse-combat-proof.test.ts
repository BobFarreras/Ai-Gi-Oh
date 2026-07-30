// src/services/security/api/parse-combat-proof.test.ts - Rechaza journals malformados antes de alcanzar el motor.
import { describe, expect, it } from "vitest";
import { parseCombatProof } from "./parse-combat-proof";

const base = {
  sessionId: "session-1",
  battleId: "battle-1",
  mode: "SURVIVAL",
  snapshotHash: "snapshot",
  protocolVersion: 1,
  entries: [],
};

describe("parseCombatProof", () => {
  it("acepta la estructura mínima de una prueba Survival", () => {
    expect(parseCombatProof(base)).toMatchObject(base);
  });

  it("rechaza acciones ajenas al protocolo", () => {
    expect(() => parseCombatProof({
      ...base,
      entries: [{ sequence: 1, actorPlayerId: "player-1", action: { type: "GIVE_REWARD", payload: {} } }],
    })).toThrow("desconocida");
  });

  it("rechaza secuencias no enteras en lugar de corregirlas", () => {
    expect(() => parseCombatProof({
      ...base,
      entries: [{ sequence: "1", actorPlayerId: "player-1", action: { type: "NEXT_PHASE", payload: {} } }],
    })).toThrow("secuencia");
  });
});
