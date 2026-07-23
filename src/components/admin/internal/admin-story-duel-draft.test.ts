// src/components/admin/internal/admin-story-duel-draft.test.ts - Cartas y atributos del duelo tienen que salir
// SIEMPRE alineados: es el bug por el que "a veces" se perdían los atributos al guardar un mazo con huecos.
import { describe, expect, it } from "vitest";
import { IAdminStoryDeckApiResponse } from "@/components/admin/admin-story-deck-api";
import { resolveDraftByDuel, resolveDraftSlotLevels } from "@/components/admin/internal/admin-story-duel-draft";

const DUEL_ID = "story-ch1-duel-1";

function buildOverride(slotIndex: number, cardId: string, attackOverride: number | null) {
  return {
    duelId: DUEL_ID,
    slotIndex,
    cardId,
    copies: 1,
    versionTier: 0,
    level: slotIndex,
    xp: 0,
    attackOverride,
    defenseOverride: null,
    effectOverride: null,
    isActive: true,
  };
}

/** Respuesta mínima del API admin: solo lo que leen estos resolvers. */
function buildData(overrides: ReturnType<typeof buildOverride>[]): IAdminStoryDeckApiResponse {
  return {
    deck: { deckListId: "deck-1", opponentId: "opp-1", name: "Deck", description: "", version: 1, isActive: true, slots: [] },
    opponents: [],
    duels: [],
    duelAiProfiles: [],
    duelDeckOverrides: overrides,
    duelFusionCards: [],
    duelRewardCards: [],
    availableCards: [],
  } as unknown as IAdminStoryDeckApiResponse;
}

describe("resolveDraftSlotLevels", () => {
  it("alinea cada carta con SUS atributos cuando los slots guardados son contiguos", () => {
    const data = buildData([buildOverride(0, "card-a", 1500), buildOverride(1, "card-b", null), buildOverride(2, "card-c", 900)]);
    expect(resolveDraftByDuel(data, DUEL_ID)).toEqual(["card-a", "card-b", "card-c"]);
    expect(resolveDraftSlotLevels(data, DUEL_ID).map((entry) => entry.attackOverride)).toEqual([1500, null, 900]);
  });

  it("con HUECOS en los slots guardados, los atributos siguen cada uno con su carta (no se corren)", () => {
    // Datos heredados de cuando el guardado dejaba huecos: slots 0, 3 y 7. La parrilla los empaqueta a 0,1,2 y
    // los atributos tienen que empaquetarse igual; antes se buscaban por slotIndex y card-d/card-h los perdían.
    const data = buildData([buildOverride(0, "card-a", 1500), buildOverride(3, "card-d", 2400), buildOverride(7, "card-h", 300)]);
    expect(resolveDraftByDuel(data, DUEL_ID)).toEqual(["card-a", "card-d", "card-h"]);
    const levels = resolveDraftSlotLevels(data, DUEL_ID);
    expect(levels.map((entry) => entry.attackOverride)).toEqual([1500, 2400, 300]);
    expect(levels.map((entry) => entry.level)).toEqual([0, 3, 7]);
  });

  it("expande las copias: una fila con 2 copias ocupa 2 posiciones con los mismos atributos", () => {
    const data = buildData([{ ...buildOverride(0, "card-a", 1500), copies: 2 }, buildOverride(1, "card-b", 700)]);
    expect(resolveDraftByDuel(data, DUEL_ID)).toEqual(["card-a", "card-a", "card-b"]);
    expect(resolveDraftSlotLevels(data, DUEL_ID).map((entry) => entry.attackOverride)).toEqual([1500, 1500, 700]);
  });

  it("sin duelo seleccionado no inventa atributos", () => {
    expect(resolveDraftSlotLevels(buildData([]), null)).toEqual([]);
  });
});

describe("aplicación por CARTA (como los objetos del jugador)", () => {
  it("un atributo puesto en un slot alcanza a TODAS las copias de esa carta del mazo", async () => {
    const { applySlotOverrideToSameCards, applyMassLevels } = await import("@/components/admin/internal/admin-story-deck-editor-state");
    const { getMaxCardLevel } = await import("@/core/services/progression/card-level-rules");
    const cards = ["card-a", "card-b", "card-a"];
    const levels = cards.map(() => ({ versionTier: 0, level: 0, xp: 0, attackOverride: null, defenseOverride: null }));

    // Se edita la copia del slot 0: la del slot 2 (misma carta) tiene que quedar igual; card-b no se toca.
    const next = applySlotOverrideToSameCards(levels, cards, 0, "ATTACK", 2400);
    expect(next.map((row) => row.attackOverride)).toEqual([2400, null, 2400]);

    // Y la edición masiva ya no recorta el nivel al viejo tope de 30.
    const massed = applyMassLevels(levels, cards, { versionTier: 5, level: getMaxCardLevel(), xp: 0 });
    expect(massed.map((row) => row.level)).toEqual(cards.map(() => getMaxCardLevel()));
  });
});
