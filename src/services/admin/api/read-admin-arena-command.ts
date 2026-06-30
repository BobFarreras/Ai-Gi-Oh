// src/services/admin/api/read-admin-arena-command.ts - Parsea y valida los comandos de upsert del catálogo de arena desde el panel admin.
import { ValidationError } from "@/core/errors/ValidationError";
import {
  IAdminArenaCardEntry,
  IUpsertArenaOpponentCommand,
  IUpsertArenaTierCommand,
  IUpsertArenaVariantCommand,
} from "@/core/entities/training/IAdminArena";

type Raw = Record<string, unknown>;

function asString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) throw new ValidationError(`${field} es obligatorio.`);
  return value.trim();
}
function asOptionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
function asNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new ValidationError(`${field} debe ser un número.`);
  return value;
}
function asOptionalNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readCardEntries(value: unknown, field: string): IAdminArenaCardEntry[] {
  if (!Array.isArray(value)) throw new ValidationError(`${field} debe ser una lista de cartas.`);
  return value.map((raw) => {
    const entry = raw as Raw;
    return { cardId: asString(entry.cardId, "La carta"), versionTier: asOptionalNumber(entry.versionTier), level: asOptionalNumber(entry.level), xp: asOptionalNumber(entry.xp) };
  });
}

export function readArenaOpponentCommand(data: Raw): IUpsertArenaOpponentCommand {
  return {
    id: asString(data.id, "El id del oponente"),
    codeName: asString(data.codeName, "El codeName"),
    displayName: asString(data.displayName, "El nombre visible"),
    avatarUrl: asString(data.avatarUrl, "El avatar"),
    introUrl: asString(data.introUrl, "La intro"),
    storyOpponentId: asString(data.storyOpponentId, "El storyOpponentId"),
    isActive: data.isActive === true,
    sortOrder: asOptionalNumber(data.sortOrder) ?? 0,
  };
}

export function readArenaVariantCommand(data: Raw): IUpsertArenaVariantCommand {
  return {
    id: asString(data.id, "El id de la variante"),
    opponentId: asString(data.opponentId, "El oponente"),
    label: asOptionalString(data.label),
    sortOrder: asOptionalNumber(data.sortOrder) ?? 0,
    isActive: data.isActive === true,
    deckCards: readCardEntries(data.deckCards, "El mazo"),
    fusionCards: readCardEntries(data.fusionCards, "El mazo de fusión"),
  };
}

export function readArenaTierCommand(data: Raw): IUpsertArenaTierCommand {
  const tier = asNumber(data.tier, "El tier");
  if (!Number.isInteger(tier) || tier <= 0) throw new ValidationError("El tier debe ser un entero positivo.");
  return {
    tier,
    code: asString(data.code, "El código"),
    requiredWinsInPreviousTier: asOptionalNumber(data.requiredWinsInPreviousTier) ?? 0,
    aiDifficulty: asString(data.aiDifficulty, "La dificultad IA"),
    opponentId: asString(data.opponentId, "El oponente"),
    rewardMultiplier: asNumber(data.rewardMultiplier, "El multiplicador de recompensa"),
    isActive: data.isActive === true,
    defaultVersionTier: asOptionalNumber(data.defaultVersionTier),
    defaultLevel: asOptionalNumber(data.defaultLevel),
    defaultXp: asOptionalNumber(data.defaultXp),
  };
}
