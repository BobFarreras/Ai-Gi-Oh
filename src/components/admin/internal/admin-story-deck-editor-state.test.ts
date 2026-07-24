// src/components/admin/internal/admin-story-deck-editor-state.test.ts - El escalado es de la CARTA, no del
// hueco: colocar una carta en un slot usado no puede heredar el nivel/atributos de la carta anterior.
import { describe, expect, it } from "vitest";
import { EMPTY_SLOT_LEVEL_DRAFT, IStorySlotLevelDraft } from "@/components/admin/internal/admin-story-duel-draft";
import { clearLevelsAtSlot, resolveLevelsForPlacedCard, swapLevelsBetweenSlots } from "@/components/admin/internal/admin-story-deck-editor-state";

function buildLevels(rows: Array<Partial<IStorySlotLevelDraft>>): IStorySlotLevelDraft[] {
  return rows.map((row) => ({ ...EMPTY_SLOT_LEVEL_DRAFT, ...row }));
}

describe("resolveLevelsForPlacedCard", () => {
  it("limpia el slot cuando la carta que entra no tiene otra copia en el deck", () => {
    const levels = buildLevels([{ level: 60, attackOverride: 4000 }, {}]);
    const next = resolveLevelsForPlacedCard(levels, ["card-a", null], 0, "card-b");
    expect(next[0]).toEqual(EMPTY_SLOT_LEVEL_DRAFT);
  });

  it("hereda el escalado de otra copia de la MISMA carta", () => {
    const levels = buildLevels([{ level: 30, attackOverride: 2500 }, {}]);
    const next = resolveLevelsForPlacedCard(levels, ["card-a", null], 1, "card-a");
    expect(next[1]).toEqual({ ...EMPTY_SLOT_LEVEL_DRAFT, level: 30, attackOverride: 2500 });
    expect(next[0]).toEqual({ ...EMPTY_SLOT_LEVEL_DRAFT, level: 30, attackOverride: 2500 });
  });
});

describe("clearLevelsAtSlot", () => {
  it("vacía el escalado del hueco sin tocar los demás", () => {
    const levels = buildLevels([{ level: 60 }, { level: 10 }]);
    expect(clearLevelsAtSlot(levels, 0)).toEqual(buildLevels([{}, { level: 10 }]));
  });
});

describe("swapLevelsBetweenSlots", () => {
  it("mueve los atributos junto con la carta al intercambiar huecos", () => {
    const levels = buildLevels([{ level: 60, attackOverride: 4000 }, { level: 5 }]);
    expect(swapLevelsBetweenSlots(levels, 0, 1)).toEqual(buildLevels([{ level: 5 }, { level: 60, attackOverride: 4000 }]));
  });

  it("rellena huecos inexistentes en vez de dejar undefined", () => {
    const next = swapLevelsBetweenSlots(buildLevels([{ level: 60 }]), 0, 2);
    expect(next).toHaveLength(3);
    expect(next[2]).toEqual({ ...EMPTY_SLOT_LEVEL_DRAFT, level: 60 });
    expect(next[0]).toEqual(EMPTY_SLOT_LEVEL_DRAFT);
  });
});
