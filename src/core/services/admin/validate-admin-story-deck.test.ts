// src/core/services/admin/validate-admin-story-deck.test.ts - Cubre reglas de validación del guardado admin para duelConfig Story.
import { describe, expect, it } from "vitest";
import { IAdminSaveStoryDeckCommand } from "@/core/entities/admin/IAdminStoryDeckCommands";
import { validateAdminSaveStoryDeckCommand } from "@/core/services/admin/validate-admin-story-deck";
import { getMaxCardLevel } from "@/core/services/progression/card-level-rules";
import { MAX_CARD_VERSION_TIER } from "@/core/services/progression/card-version-rules";

function buildCommand(partial?: Partial<IAdminSaveStoryDeckCommand>): IAdminSaveStoryDeckCommand {
  return {
    deckListId: "story-deck-1",
    cardIds: ["entity-chatgpt", "entity-gemini"],
    updateBaseDeck: false,
    duelConfig: {
      duelId: "story-ch1-duel-1",
      difficulty: "STANDARD",
      aiProfile: { style: "balanced", aggression: 0.4 },
      fusionCardIds: ["fusion-gemgpt", "fusion-kaclauli"],
      rewardCardIds: ["exec-fusion-gemgpt"],
      slotOverrides: [{ slotIndex: 0, cardId: "entity-chatgpt", versionTier: 0, level: 0, xp: 0, attackOverride: null, defenseOverride: null }],
    },
    ...partial,
  };
}

describe("validateAdminSaveStoryDeckCommand", () => {
  it("acepta niveles hasta el máximo REAL de carta del juego (el tope viejo de 30 bloqueaba escalados válidos)", () => {
    const maxLevel = getMaxCardLevel();
    const atCap = buildCommand({
      duelConfig: {
        ...buildCommand().duelConfig!,
        slotOverrides: [{ slotIndex: 0, cardId: "entity-chatgpt", versionTier: MAX_CARD_VERSION_TIER, level: maxLevel, xp: 0, attackOverride: null, defenseOverride: null }],
      },
    });
    expect(() => validateAdminSaveStoryDeckCommand(atCap)).not.toThrow();
  });

  it("rechaza niveles por encima del máximo diciendo QUÉ slot y QUÉ carta fallan", () => {
    const overCap = buildCommand({
      duelConfig: {
        ...buildCommand().duelConfig!,
        slotOverrides: [{ slotIndex: 3, cardId: "entity-chatgpt", versionTier: 0, level: getMaxCardLevel() + 1, xp: 0, attackOverride: null, defenseOverride: null }],
      },
    });
    expect(() => validateAdminSaveStoryDeckCommand(overCap)).toThrow(/Slot 4 \(entity-chatgpt\)/);
  });

  it("rechaza nivel o versión no enteros", () => {
    const fractionalLevel = buildCommand({
      duelConfig: {
        ...buildCommand().duelConfig!,
        slotOverrides: [{ slotIndex: 0, cardId: "entity-chatgpt", versionTier: 0, level: 12.5, xp: 0, attackOverride: null, defenseOverride: null }],
      },
    });
    expect(() => validateAdminSaveStoryDeckCommand(fractionalLevel)).toThrow(/entero/);
  });

  it("acepta configuración de duelo con 2 cartas de fusión y recompensa opcional", () => {
    expect(() => validateAdminSaveStoryDeckCommand(buildCommand())).not.toThrow();
  });

  it("acepta duelo con 0 o 1 cartas de fusión (fusiones opcionales)", () => {
    const withOne = buildCommand({ duelConfig: { ...buildCommand().duelConfig!, fusionCardIds: ["fusion-gemgpt"] } });
    const withNone = buildCommand({ duelConfig: { ...buildCommand().duelConfig!, fusionCardIds: [] } });
    expect(() => validateAdminSaveStoryDeckCommand(withOne)).not.toThrow();
    expect(() => validateAdminSaveStoryDeckCommand(withNone)).not.toThrow();
  });

  it("rechaza duelo con más de 2 cartas de fusión", () => {
    const command = buildCommand({
      duelConfig: {
        ...buildCommand().duelConfig!,
        fusionCardIds: ["fusion-a", "fusion-b", "fusion-c"],
      },
    });
    expect(() => validateAdminSaveStoryDeckCommand(command)).toThrow("máximo 2 cartas de fusión");
  });

  it("rechaza cartas de recompensa duplicadas", () => {
    const command = buildCommand({
      duelConfig: {
        ...buildCommand().duelConfig!,
        rewardCardIds: ["exec-fusion-gemgpt", "exec-fusion-gemgpt"],
      },
    });
    expect(() => validateAdminSaveStoryDeckCommand(command)).toThrow("No se pueden duplicar cartas de recompensa");
  });
});
