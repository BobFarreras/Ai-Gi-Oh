// src/components/admin/internal/arena/admin-arena-deck-entry-state.test.ts - Los atributos son de la CARTA:
// todas las copias de la misma carta de una variante quedan iguales (el bug era una Hostinger a +300 y otra a 0).
import { describe, expect, it } from "vitest";
import { IAdminArenaCardEntry } from "@/core/entities/training/IAdminArena";
import {
  applyArenaBonusToSameCards,
  applyArenaScaleToSameCards,
} from "@/components/admin/internal/arena/admin-arena-deck-entry-state";

function entry(cardId: string, partial: Partial<IAdminArenaCardEntry> = {}): IAdminArenaCardEntry {
  return { cardId, versionTier: null, level: null, xp: null, attackBonus: null, defenseBonus: null, ...partial };
}

describe("edición de cartas del mazo de arena", () => {
  it("el bonus de ATK alcanza a todas las copias de esa carta, en mazo y en fusión", () => {
    const entries = {
      deck: [entry("card-hostinger"), entry("card-vercel"), entry("card-hostinger")],
      fusion: [entry("card-hostinger")],
    };
    const next = applyArenaBonusToSameCards(entries, "DECK", 0, "ATTACK", 300);
    expect(next.deck.map((row) => row.attackBonus)).toEqual([300, null, 300]);
    expect(next.fusion.map((row) => row.attackBonus)).toEqual([300]);
  });

  it("copias descuadradas convergen al valor de la que editas (no se les suma el delta por separado)", () => {
    const entries = {
      deck: [entry("card-hostinger", { attackBonus: 300 }), entry("card-hostinger", { attackBonus: 100 })],
      fusion: [],
    };
    // Editas la primera (+100 → 400): la segunda deja de ir por libre y se queda también en 400.
    const next = applyArenaBonusToSameCards(entries, "DECK", 0, "ATTACK", 100);
    expect(next.deck.map((row) => row.attackBonus)).toEqual([400, 400]);
  });

  it("el bonus nunca baja de 0 y no toca a las demás cartas", () => {
    const entries = { deck: [entry("card-hostinger", { attackBonus: 100 }), entry("card-vercel", { attackBonus: 500 })], fusion: [] };
    const next = applyArenaBonusToSameCards(entries, "DECK", 0, "ATTACK", -300);
    expect(next.deck.map((row) => row.attackBonus)).toEqual([0, 500]);
  });

  it("el escalado (nivel) también se propaga a todas las copias", () => {
    const entries = { deck: [entry("card-hostinger"), entry("card-hostinger")], fusion: [] };
    const next = applyArenaScaleToSameCards(entries, "DECK", 1, "level", 45);
    expect(next.deck.map((row) => row.level)).toEqual([45, 45]);
  });

  it("un índice que no existe no rompe ni cambia nada", () => {
    const entries = { deck: [entry("card-hostinger")], fusion: [] };
    expect(applyArenaBonusToSameCards(entries, "FUSION", 4, "ATTACK", 100)).toBe(entries);
  });
});
