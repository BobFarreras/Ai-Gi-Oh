// src/core/repositories/admin/IAdminCatalogRepository.ts - Contrato de persistencia para gestión administrativa de catálogo y mercado.
import {
  IAdminCardCatalogEntry,
  IAdminCatalogSnapshot,
  IAdminMarketCardListingEntry,
  IAdminMarketPackEntry,
  IAdminPackPoolEntry,
} from "@/core/entities/admin/IAdminCatalogSnapshot";
import {
  IAdminUpsertCardCatalogCommand,
  IAdminUpsertMarketListingCommand,
  IAdminUpsertMarketPackCommand,
  IAdminUpsertPackPoolEntryCommand,
} from "@/core/entities/admin/IAdminCatalogCommands";

export interface IAdminCatalogRepository {
  listCards(): Promise<IAdminCardCatalogEntry[]>;
  listListings(): Promise<IAdminMarketCardListingEntry[]>;
  listPacks(): Promise<IAdminMarketPackEntry[]>;
  listPackPoolEntries(packPoolId: string): Promise<IAdminPackPoolEntry[]>;
  upsertCard(command: IAdminUpsertCardCatalogCommand): Promise<void>;
  upsertListing(command: IAdminUpsertMarketListingCommand): Promise<void>;
  upsertPack(command: IAdminUpsertMarketPackCommand): Promise<void>;
  deletePack(packId: string): Promise<void>;
  replacePackPoolEntries(packPoolId: string, entries: IAdminUpsertPackPoolEntryCommand[]): Promise<void>;
}

/**
 * Compone snapshot completo de catálogo admin para evitar lógica de agregación en UI.
 */
export async function buildAdminCatalogSnapshot(repository: IAdminCatalogRepository): Promise<IAdminCatalogSnapshot> {
  const [cards, listings, packs] = await Promise.all([repository.listCards(), repository.listListings(), repository.listPacks()]);
  return { cards, listings, packs };
}
