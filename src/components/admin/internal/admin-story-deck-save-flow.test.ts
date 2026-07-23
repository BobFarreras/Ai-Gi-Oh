// src/components/admin/internal/admin-story-deck-save-flow.test.ts - El guardado tiene que numerar los overrides
// con la MISMA posición compactada que las cartas; si no, un hueco en la parrilla descoloca los atributos.
import { describe, expect, it, vi } from "vitest";

const saveAdminStoryDeck = vi.fn().mockResolvedValue(undefined);
vi.mock("@/components/admin/admin-story-deck-api", () => ({ saveAdminStoryDeck: (payload: unknown) => saveAdminStoryDeck(payload) }));

const { executeAdminStoryDeckSave } = await import("@/components/admin/internal/admin-story-deck-save-flow");

function levelsFor(attackOverride: number | null) {
  return { versionTier: 0, level: 0, xp: 0, attackOverride, defenseOverride: null };
}

describe("executeAdminStoryDeckSave", () => {
  it("compacta cartas y overrides con el MISMO índice cuando la parrilla tiene huecos", async () => {
    saveAdminStoryDeck.mockClear();
    await executeAdminStoryDeckSave({
      deckListId: "deck-1",
      deckOpponentId: "opp-1",
      selectedOpponentId: "opp-1",
      selectedDuelId: "story-ch1-duel-1",
      selectedDuelDifficulty: "STANDARD",
      duelAiStyle: "balanced",
      duelAiAggression: 0.5,
      // Hueco en la posición 1: la carta "card-c" queda en la 2 del borrador pero en la 1 del mazo guardado.
      draftCardIds: ["card-a", null, "card-c"],
      draftSlotLevels: [levelsFor(1500), levelsFor(null), levelsFor(2400)],
      draftFusionCardIds: [],
      draftRewardCardIds: [],
      isBaseDeckMode: false,
      load: async () => undefined,
    });

    const payload = saveAdminStoryDeck.mock.calls[0][0];
    expect(payload.cardIds).toEqual(["card-a", "card-c"]);
    // Índices contiguos y cada uno con los atributos de SU carta (card-c conserva sus 2400).
    expect(payload.duelConfig.slotOverrides).toEqual([
      { slotIndex: 0, cardId: "card-a", versionTier: 0, level: 0, xp: 0, attackOverride: 1500, defenseOverride: null },
      { slotIndex: 1, cardId: "card-c", versionTier: 0, level: 0, xp: 0, attackOverride: 2400, defenseOverride: null },
    ]);
  });

  it("en modo deck base no manda configuración de duelo", async () => {
    saveAdminStoryDeck.mockClear();
    await executeAdminStoryDeckSave({
      deckListId: "deck-1",
      deckOpponentId: "opp-1",
      selectedOpponentId: null,
      selectedDuelId: "story-ch1-duel-1",
      selectedDuelDifficulty: "STANDARD",
      duelAiStyle: "balanced",
      duelAiAggression: 0.5,
      draftCardIds: ["card-a"],
      draftSlotLevels: [levelsFor(null)],
      draftFusionCardIds: [],
      draftRewardCardIds: [],
      isBaseDeckMode: true,
      load: async () => undefined,
    });
    expect(saveAdminStoryDeck.mock.calls[0][0].duelConfig).toBeNull();
  });
});
