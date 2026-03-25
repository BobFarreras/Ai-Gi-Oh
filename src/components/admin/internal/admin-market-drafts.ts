// src/components/admin/internal/admin-market-drafts.ts - Define drafts y conversiones para edición visual de listings y packs de mercado.
import { IAdminUpsertMarketListingCommand, IAdminUpsertMarketPackCommand, IAdminUpsertPackPoolEntryCommand } from "@/core/entities/admin/IAdminCatalogCommands";
import { IAdminMarketCardListingEntry, IAdminMarketPackEntry } from "@/core/entities/admin/IAdminCatalogSnapshot";
import { MarketRarity } from "@/core/entities/market/IMarketRarity";

export interface IAdminMarketListingDraft {
  id: string;
  cardId: string;
  rarity: MarketRarity;
  priceNexusText: string;
  stockText: string;
  isAvailable: boolean;
}

export interface IAdminPackPoolEntryDraft {
  id: string;
  cardId: string;
  rarity: MarketRarity;
  weightText: string;
}

export interface IAdminMarketPackDraft {
  id: string;
  name: string;
  description: string;
  priceNexusText: string;
  cardsPerPackText: string;
  packPoolId: string;
  previewCardIdsText: string;
  isAvailable: boolean;
  poolEntries: IAdminPackPoolEntryDraft[];
}

function parseNullableNumber(value: string): number | null {
  const normalized = value.trim();
  if (normalized.length === 0) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function createListingDraft(cardId: string, listing: IAdminMarketCardListingEntry | null): IAdminMarketListingDraft {
  return {
    id: listing?.id ?? `listing-${cardId}`,
    cardId,
    rarity: listing?.rarity ?? "COMMON",
    priceNexusText: String(listing?.priceNexus ?? 0),
    stockText: listing?.stock === null || listing?.stock === undefined ? "" : String(listing.stock),
    isAvailable: listing?.isAvailable ?? true,
  };
}

export function createListingCommand(draft: IAdminMarketListingDraft): IAdminUpsertMarketListingCommand {
  const priceNexus = Number(draft.priceNexusText);
  if (!Number.isFinite(priceNexus)) throw new Error("El precio debe ser numérico.");
  return { id: draft.id.trim(), cardId: draft.cardId, rarity: draft.rarity, priceNexus, stock: parseNullableNumber(draft.stockText), isAvailable: draft.isAvailable };
}

function createPoolEntryId(packPoolId: string): string {
  const seed = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}`;
  return `${packPoolId}-${seed}`;
}

export function createEmptyPackDraft(): IAdminMarketPackDraft {
  return {
    id: "",
    name: "",
    description: "",
    priceNexusText: "0",
    cardsPerPackText: "5",
    packPoolId: "",
    previewCardIdsText: "",
    isAvailable: true,
    poolEntries: [],
  };
}

export function createPackDraft(pack: IAdminMarketPackEntry): IAdminMarketPackDraft {
  return {
    id: pack.id,
    name: pack.name,
    description: pack.description,
    priceNexusText: String(pack.priceNexus),
    cardsPerPackText: String(pack.cardsPerPack),
    packPoolId: pack.packPoolId,
    previewCardIdsText: pack.previewCardIds.join(","),
    isAvailable: pack.isAvailable,
    poolEntries: pack.poolEntries.map((entry) => ({ id: entry.id, cardId: entry.cardId, rarity: entry.rarity, weightText: String(entry.weight) })),
  };
}

export function addPoolEntry(draft: IAdminMarketPackDraft, defaultCardId: string): IAdminMarketPackDraft {
  const packPoolId = draft.packPoolId.trim().length > 0 ? draft.packPoolId : "pool-new";
  const nextEntry: IAdminPackPoolEntryDraft = { id: createPoolEntryId(packPoolId), cardId: defaultCardId, rarity: "COMMON", weightText: "10" };
  return { ...draft, poolEntries: [...draft.poolEntries, nextEntry] };
}

function createPackPoolEntries(entries: IAdminPackPoolEntryDraft[]): IAdminUpsertPackPoolEntryCommand[] {
  return entries.map((entry) => {
    const weight = Number(entry.weightText);
    if (!Number.isFinite(weight)) throw new Error("El peso del pool debe ser numérico.");
    return { id: entry.id.trim(), cardId: entry.cardId, rarity: entry.rarity, weight };
  });
}

export function createPackCommand(draft: IAdminMarketPackDraft): IAdminUpsertMarketPackCommand {
  const priceNexus = Number(draft.priceNexusText);
  const cardsPerPack = Number(draft.cardsPerPackText);
  if (!Number.isFinite(priceNexus) || !Number.isFinite(cardsPerPack)) {
    throw new Error("Precio y cartas por pack deben ser numéricos.");
  }
  return {
    id: draft.id.trim(),
    name: draft.name.trim(),
    description: draft.description.trim(),
    priceNexus,
    cardsPerPack,
    packPoolId: draft.packPoolId.trim(),
    previewCardIds: draft.previewCardIdsText.split(",").map((value) => value.trim()).filter((value) => value.length > 0),
    isAvailable: draft.isAvailable,
    poolEntries: createPackPoolEntries(draft.poolEntries),
  };
}
