// src/core/use-cases/game-engine/state/id-factory.test.ts - Verifica el determinismo de la fábrica de ids sembrada (multijugador).
import { describe, it, expect } from "vitest";
import { createSeededGameEngineIdFactory } from "./id-factory";

const SEED = "match-seed-xyz";

describe("createSeededGameEngineIdFactory", () => {
  it("deriva el instanceId de entidad SOLO de la clave (runtimeId): mismo en ambos clientes", () => {
    const a = createSeededGameEngineIdFactory(SEED);
    const b = createSeededGameEngineIdFactory("otra-seed-distinta");
    // No depende de la seed ni del contador: misma clave ⇒ mismo instanceId en
    // ambos clientes. Es lo que permite que los ataques resuelvan en el rival.
    expect(a.createEntityInstanceId("playerA-entity-x-0-abc")).toBe(b.createEntityInstanceId("playerA-entity-x-0-abc"));
  });

  it("genera instanceId distintos para claves (runtimeId) distintas", () => {
    const factory = createSeededGameEngineIdFactory(SEED);
    const ids = [
      factory.createEntityInstanceId("p-entity-x-0-a"),
      factory.createEntityInstanceId("p-entity-x-1-b"),
      factory.createEntityInstanceId("p-entity-y-0-c"),
    ];
    expect(new Set(ids).size).toBe(3);
  });

  it("produce la misma secuencia de ids con contador (logs) con la misma seed", () => {
    const a = createSeededGameEngineIdFactory(SEED);
    const b = createSeededGameEngineIdFactory(SEED);
    const seqA = [a.createCombatLogEventId("CARD_PLAYED"), a.createCombatLogEventId("ATTACK_DECLARED")];
    const seqB = [b.createCombatLogEventId("CARD_PLAYED"), b.createCombatLogEventId("ATTACK_DECLARED")];
    expect(seqB).toEqual(seqA);
  });

  it("los ids con contador son distintos en llamadas consecutivas (contador monótono)", () => {
    const factory = createSeededGameEngineIdFactory(SEED);
    const ids = [
      factory.createCombatLogEventId("CARD_PLAYED"),
      factory.createCombatLogEventId("CARD_PLAYED"),
      factory.createCombatLogEventId("CARD_PLAYED"),
    ];
    expect(new Set(ids).size).toBe(3);
  });
});
