// src/services/admin/api/read-admin-story-deck-command.ts - Parsea comando de guardado Story Deck admin con validación de payload JSON.
import { NextRequest } from "next/server";
import { IAdminSaveStoryDeckCommand, IAdminSaveStoryDuelConfigCommand } from "@/core/entities/admin/IAdminStoryDeckCommands";
import { normalizeStoryAiProfile } from "@/core/services/opponent/difficulty/story-ai-profile";
import { ValidationError } from "@/core/errors/ValidationError";
import { JsonObject, readJsonObjectBody } from "@/services/security/api/request-body-parser";

function readStringArray(payload: JsonObject, key: string): string[] {
  const value = payload[key];
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    throw new ValidationError(`El campo ${key} debe ser string[].`);
  }
  return value;
}

function readOptionalDuelConfig(payload: JsonObject): IAdminSaveStoryDeckCommand["duelConfig"] {
  const value = payload.duelConfig;
  if (value === undefined || value === null) return null;
  if (typeof value !== "object" || Array.isArray(value)) throw new ValidationError("duelConfig inválido.");
  const config = value as JsonObject;
  const slotOverrides = config.slotOverrides;
  if (!Array.isArray(slotOverrides)) throw new ValidationError("duelConfig.slotOverrides debe ser array.");
  return {
    duelId: String(config.duelId ?? ""),
    difficulty: String(config.difficulty ?? "") as IAdminSaveStoryDuelConfigCommand["difficulty"],
    aiProfile: normalizeStoryAiProfile(config.aiProfile, String(config.difficulty ?? "") as IAdminSaveStoryDuelConfigCommand["difficulty"]),
    slotOverrides: slotOverrides.map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) throw new ValidationError("slotOverrides contiene entradas inválidas.");
      const slot = entry as JsonObject;
      return {
        slotIndex: Number(slot.slotIndex ?? -1),
        cardId: String(slot.cardId ?? ""),
        versionTier: Number(slot.versionTier ?? 0),
        level: Number(slot.level ?? 0),
        xp: Number(slot.xp ?? 0),
      };
    }),
  };
}

export async function readAdminSaveStoryDeckCommand(request: NextRequest): Promise<IAdminSaveStoryDeckCommand> {
  const payload = await readJsonObjectBody(request, "Payload inválido para Story Deck admin.");
  return {
    deckListId: String(payload.deckListId ?? ""),
    cardIds: readStringArray(payload, "cardIds"),
    duelConfig: readOptionalDuelConfig(payload),
    updateBaseDeck: payload.updateBaseDeck === true,
  };
}

