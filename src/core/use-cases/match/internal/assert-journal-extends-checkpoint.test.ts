// src/core/use-cases/match/internal/assert-journal-extends-checkpoint.test.ts - Fija que el avance solo se prolongue, sin falsos conflictos por formato.
import { describe, expect, it } from "vitest";
import { ICombatJournalEntry } from "@/core/entities/match";
import { assertJournalExtendsCheckpoint } from "./assert-journal-extends-checkpoint";

const attack = {
  sequence: 1,
  actorPlayerId: "p1",
  action: {
    type: "ATTACK",
    payload: { attackerInstanceId: "atk-1", defenderInstanceId: "def-1", declineReactiveTrap: true },
  },
} as unknown as ICombatJournalEntry;

const nextPhase = {
  sequence: 2,
  actorPlayerId: "p1",
  action: { type: "NEXT_PHASE", payload: {} },
} as unknown as ICombatJournalEntry;

describe("assertJournalExtendsCheckpoint", () => {
  it("acepta un diario que prolonga el avance registrado", () => {
    expect(() => assertJournalExtendsCheckpoint([attack], [attack, nextPhase])).not.toThrow();
  });

  it("no ve conflicto cuando el avance vuelve con las claves reordenadas", () => {
    // Es lo que hace Postgres al devolver un jsonb: mismo contenido, otro orden de claves.
    const reordered = {
      sequence: 1,
      actorPlayerId: "p1",
      action: {
        payload: { declineReactiveTrap: true, defenderInstanceId: "def-1", attackerInstanceId: "atk-1" },
        type: "ATTACK",
      },
    } as unknown as ICombatJournalEntry;

    expect(() => assertJournalExtendsCheckpoint([reordered], [attack, nextPhase])).not.toThrow();
  });

  it("tolera el ida y vuelta real por jsonb del avance guardado", () => {
    // Postgres ordena las claves por longitud y bytes al persistir jsonb; se simula ese round-trip.
    const throughJsonb = JSON.parse(JSON.stringify(attack, ["actorPlayerId", "sequence", "action", "payload", "type", "declineReactiveTrap", "defenderInstanceId", "attackerInstanceId"])) as ICombatJournalEntry;

    expect(() => assertJournalExtendsCheckpoint([throughJsonb], [attack, nextPhase])).not.toThrow();
  });

  it("rechaza acortar o reescribir lo ya jugado", () => {
    expect(() => assertJournalExtendsCheckpoint([attack, nextPhase], [attack])).toThrow("más corto");
    const rewritten = {
      ...attack,
      action: { type: "ATTACK", payload: { attackerInstanceId: "otro", defenderInstanceId: "def-1" } },
    } as unknown as ICombatJournalEntry;
    expect(() => assertJournalExtendsCheckpoint([attack], [rewritten])).toThrow("contradice");
  });
});
