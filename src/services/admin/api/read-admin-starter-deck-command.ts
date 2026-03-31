// src/services/admin/api/read-admin-starter-deck-command.ts - Parsea payload de guardado starter deck admin con validación de forma.
import { NextRequest } from "next/server";
import { IAdminSaveStarterDeckTemplateCommand } from "@/core/entities/admin/IAdminStarterDeckCommands";
import { ValidationError } from "@/core/errors/ValidationError";
import { JsonObject, readJsonObjectBody } from "@/services/security/api/request-body-parser";

function readStringArray(payload: JsonObject, key: string): string[] {
  const value = payload[key];
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    throw new ValidationError(`El campo ${key} debe ser string[].`);
  }
  return value;
}

function readBoolean(payload: JsonObject, key: string): boolean {
  const value = payload[key];
  if (typeof value !== "boolean") throw new ValidationError(`El campo ${key} debe ser boolean.`);
  return value;
}

export async function readAdminSaveStarterDeckTemplateCommand(request: NextRequest): Promise<IAdminSaveStarterDeckTemplateCommand> {
  const payload = await readJsonObjectBody(request, "Payload inválido para starter deck admin.");
  return {
    templateKey: String(payload.templateKey ?? ""),
    cardIds: readStringArray(payload, "cardIds"),
    activate: readBoolean(payload, "activate"),
  };
}
