// src/core/services/match/combat-action-journal.test.ts - Verifica captura ordenada e inmutable de acciones para CombatProof.
import { describe, expect, it } from "vitest";
import { CombatActionJournal } from "./combat-action-journal";

describe("CombatActionJournal", () => {
  it("numera acciones, devuelve copias y permite reiniciar una batalla", () => {
    const journal = new CombatActionJournal();
    journal.append("p1", { type: "NEXT_PHASE", payload: {} });
    journal.append("p2", { type: "CHANGE_ENTITY_MODE", payload: { instanceId: "entity-1", newMode: "DEFENSE" } });

    const snapshot = journal.getEntries();
    expect(snapshot.map((entry) => entry.sequence)).toEqual([1, 2]);
    snapshot.pop();
    expect(journal.getEntries()).toHaveLength(2);

    journal.reset();
    expect(journal.getEntries()).toEqual([]);
    expect(journal.append("p1", { type: "NEXT_PHASE", payload: {} })?.sequence).toBe(1);
  });

  it("rechaza un actor vacío por ser un error de programación", () => {
    const journal = new CombatActionJournal(1);
    expect(() => journal.append(" ", { type: "NEXT_PHASE", payload: {} })).toThrow("actor");
  });

  it("se marca desbordado en vez de romper el combate en curso", () => {
    const journal = new CombatActionJournal(1);
    journal.append("p1", { type: "NEXT_PHASE", payload: {} });

    expect(journal.hasOverflowed()).toBe(false);
    expect(journal.append("p1", { type: "NEXT_PHASE", payload: {} })).toBeNull();
    expect(journal.hasOverflowed()).toBe(true);
    expect(journal.getEntries()).toHaveLength(1);

    journal.reset();
    expect(journal.hasOverflowed()).toBe(false);
  });
});
