// src/services/admin/api/read-admin-shop-object-command.ts - Parsea los payloads del CRUD de objetos del mercado
// con narrowing estricto. La validación de rangos/negocio vive en los casos de uso.
import { NextRequest } from "next/server";
import {
  IAdminUpsertCardUpgradeItemCommand,
  IAdminUpsertLevelCandyCommand,
} from "@/core/entities/admin/IAdminShopObjects";
import { ValidationError } from "@/core/errors/ValidationError";
import { JsonObject, readJsonObjectBody } from "@/services/security/api/request-body-parser";

function readNullableString(payload: JsonObject, key: string): string | null {
  const value = payload[key];
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") throw new ValidationError(`El campo ${key} debe ser string o null.`);
  return value;
}

function readBoolean(payload: JsonObject, key: string): boolean {
  const value = payload[key];
  if (typeof value !== "boolean") throw new ValidationError(`El campo ${key} debe ser boolean.`);
  return value;
}

export async function readAdminLevelCandyCommand(request: NextRequest): Promise<IAdminUpsertLevelCandyCommand> {
  const payload = await readJsonObjectBody(request, "Payload inválido para caramelo admin.");
  return {
    id: String(payload.id ?? ""),
    name: String(payload.name ?? ""),
    levels: Number(payload.levels ?? NaN),
    priceNexus: Number(payload.priceNexus ?? NaN),
    imageUrl: readNullableString(payload, "imageUrl"),
    isActive: readBoolean(payload, "isActive"),
  };
}

export async function readAdminCardUpgradeItemCommand(request: NextRequest): Promise<IAdminUpsertCardUpgradeItemCommand> {
  const payload = await readJsonObjectBody(request, "Payload inválido para objeto de mejora admin.");
  return {
    id: String(payload.id ?? ""),
    name: String(payload.name ?? ""),
    stat: String(payload.stat ?? "") as IAdminUpsertCardUpgradeItemCommand["stat"],
    value: Number(payload.value ?? NaN),
    priceNexus: Number(payload.priceNexus ?? NaN),
    imageUrl: readNullableString(payload, "imageUrl"),
    isActive: readBoolean(payload, "isActive"),
  };
}
