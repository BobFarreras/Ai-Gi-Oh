// src/services/admin/api/read-admin-story-deck-command.ts - Parsea comando de guardado Story Deck admin con validación de payload JSON.
import { NextRequest } from "next/server";
import { IAdminSaveStoryDeckCommand } from "@/core/entities/admin/IAdminStoryDeckCommands";
import { ValidationError } from "@/core/errors/ValidationError";
import { JsonObject, readJsonObjectBody } from "@/services/security/api/request-body-parser";

function readStringArray(payload: JsonObject, key: string): string[] {
  const value = payload[key];
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    throw new ValidationError(`El campo ${key} debe ser string[].`);
  }
  return value;
}

export async function readAdminSaveStoryDeckCommand(request: NextRequest): Promise<IAdminSaveStoryDeckCommand> {
  const payload = await readJsonObjectBody(request, "Payload inválido para Story Deck admin.");
  return {
    deckListId: String(payload.deckListId ?? ""),
    cardIds: readStringArray(payload, "cardIds"),
  };
}

