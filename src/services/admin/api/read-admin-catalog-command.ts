// src/services/admin/api/read-admin-catalog-command.ts - Parsea payloads de comandos admin con type narrowing estricto.
import { NextRequest } from "next/server";
import {
  IAdminUpsertCardCatalogCommand,
  IAdminUpsertMarketListingCommand,
  IAdminUpsertMarketPackCommand,
  IAdminUpsertPackPoolEntryCommand,
} from "@/core/entities/admin/IAdminCatalogCommands";
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

function readNumberOrNull(payload: JsonObject, key: string): number | null {
  const value = payload[key];
  if (value === null || value === undefined) return null;
  if (typeof value !== "number" || Number.isNaN(value)) throw new ValidationError(`El campo ${key} debe ser number o null.`);
  return value;
}

function readStringArray(payload: JsonObject, key: string): string[] {
  const value = payload[key];
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    throw new ValidationError(`El campo ${key} debe ser string[].`);
  }
  return value;
}

export async function readAdminCardCommand(request: NextRequest): Promise<IAdminUpsertCardCatalogCommand> {
  const payload = await readJsonObjectBody(request, "Payload inválido para carta admin.");
  return {
    id: String(payload.id ?? ""),
    name: String(payload.name ?? ""),
    description: String(payload.description ?? ""),
    type: String(payload.type ?? "") as IAdminUpsertCardCatalogCommand["type"],
    faction: String(payload.faction ?? "") as IAdminUpsertCardCatalogCommand["faction"],
    cost: Number(payload.cost ?? NaN),
    attack: readNumberOrNull(payload, "attack"),
    defense: readNumberOrNull(payload, "defense"),
    archetype: readNullableString(payload, "archetype") as IAdminUpsertCardCatalogCommand["archetype"],
    trigger: readNullableString(payload, "trigger") as IAdminUpsertCardCatalogCommand["trigger"],
    bgUrl: readNullableString(payload, "bgUrl"),
    renderUrl: readNullableString(payload, "renderUrl"),
    effect: payload.effect ?? null,
    fusionRecipeId: readNullableString(payload, "fusionRecipeId"),
    fusionMaterialIds: readStringArray(payload, "fusionMaterialIds"),
    fusionEnergyRequirement: readNumberOrNull(payload, "fusionEnergyRequirement"),
    isActive: readBoolean(payload, "isActive"),
  };
}

export async function readAdminListingCommand(request: NextRequest): Promise<IAdminUpsertMarketListingCommand> {
  const payload = await readJsonObjectBody(request, "Payload inválido para listing admin.");
  return {
    id: String(payload.id ?? ""),
    cardId: String(payload.cardId ?? ""),
    rarity: String(payload.rarity ?? "") as IAdminUpsertMarketListingCommand["rarity"],
    priceNexus: Number(payload.priceNexus ?? NaN),
    stock: readNumberOrNull(payload, "stock"),
    isAvailable: readBoolean(payload, "isAvailable"),
  };
}

function readPoolEntries(payload: JsonObject): IAdminUpsertPackPoolEntryCommand[] {
  const value = payload.poolEntries;
  if (!Array.isArray(value)) throw new ValidationError("El campo poolEntries debe ser array.");
  return value.map((entry) => {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      throw new ValidationError("Cada pool entry debe ser objeto.");
    }
    const poolEntry = entry as JsonObject;
    return {
      id: String(poolEntry.id ?? ""),
      cardId: String(poolEntry.cardId ?? ""),
      rarity: String(poolEntry.rarity ?? "") as IAdminUpsertPackPoolEntryCommand["rarity"],
      weight: Number(poolEntry.weight ?? NaN),
    };
  });
}

export async function readAdminPackCommand(request: NextRequest): Promise<IAdminUpsertMarketPackCommand> {
  const payload = await readJsonObjectBody(request, "Payload inválido para pack admin.");
  return {
    id: String(payload.id ?? ""),
    name: String(payload.name ?? ""),
    description: String(payload.description ?? ""),
    priceNexus: Number(payload.priceNexus ?? NaN),
    cardsPerPack: Number(payload.cardsPerPack ?? NaN),
    packPoolId: String(payload.packPoolId ?? ""),
    previewCardIds: readStringArray(payload, "previewCardIds"),
    isAvailable: readBoolean(payload, "isAvailable"),
    poolEntries: readPoolEntries(payload),
  };
}
