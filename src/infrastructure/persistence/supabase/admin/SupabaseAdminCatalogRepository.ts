// src/infrastructure/persistence/supabase/admin/SupabaseAdminCatalogRepository.ts - Implementa persistencia admin para catálogo de cartas y mercado.
import { SupabaseClient } from "@supabase/supabase-js";
import {
  IAdminUpsertCardCatalogCommand,
  IAdminUpsertMarketListingCommand,
  IAdminUpsertMarketPackCommand,
  IAdminUpsertPackPoolEntryCommand,
} from "@/core/entities/admin/IAdminCatalogCommands";
import {
  IAdminCardCatalogEntry,
  IAdminMarketCardListingEntry,
  IAdminMarketPackEntry,
  IAdminPackPoolEntry,
} from "@/core/entities/admin/IAdminCatalogSnapshot";
import { ValidationError } from "@/core/errors/ValidationError";
import { IAdminCatalogRepository } from "@/core/repositories/admin/IAdminCatalogRepository";

interface ICardRow extends Omit<IAdminCardCatalogEntry, "bgUrl" | "renderUrl" | "fusionRecipeId" | "fusionMaterialIds" | "fusionEnergyRequirement" | "isActive"> {
  bg_url: string | null;
  render_url: string | null;
  fusion_recipe_id: string | null;
  fusion_material_ids: string[];
  fusion_energy_requirement: number | null;
  is_active: boolean;
}

interface IListingRow extends Omit<IAdminMarketCardListingEntry, "cardId" | "priceNexus" | "isAvailable"> {
  card_id: string;
  price_nexus: number;
  is_available: boolean;
}

interface IPackRow extends Omit<IAdminMarketPackEntry, "priceNexus" | "cardsPerPack" | "packPoolId" | "previewCardIds" | "isAvailable" | "poolEntries"> {
  price_nexus: number;
  cards_per_pack: number;
  pack_pool_id: string;
  preview_card_ids: string[];
  is_available: boolean;
}

interface IPoolEntryRow extends Omit<IAdminPackPoolEntry, "packPoolId" | "cardId"> {
  pack_pool_id: string;
  card_id: string;
}

function mapCardRow(row: ICardRow): IAdminCardCatalogEntry {
  return { ...row, bgUrl: row.bg_url, renderUrl: row.render_url, fusionRecipeId: row.fusion_recipe_id, fusionMaterialIds: row.fusion_material_ids, fusionEnergyRequirement: row.fusion_energy_requirement, isActive: row.is_active };
}

function mapListingRow(row: IListingRow): IAdminMarketCardListingEntry {
  return { id: row.id, cardId: row.card_id, rarity: row.rarity, priceNexus: row.price_nexus, stock: row.stock, isAvailable: row.is_available };
}

function mapPoolRow(row: IPoolEntryRow): IAdminPackPoolEntry {
  return { id: row.id, packPoolId: row.pack_pool_id, cardId: row.card_id, rarity: row.rarity, weight: row.weight };
}

export class SupabaseAdminCatalogRepository implements IAdminCatalogRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listCards(): Promise<IAdminCardCatalogEntry[]> {
    const { data, error } = await this.client.from("cards_catalog").select("*").order("id", { ascending: true });
    if (error) throw new ValidationError("No se pudo leer el catálogo de cartas admin.");
    return ((data ?? []) as ICardRow[]).map(mapCardRow);
  }

  async listListings(): Promise<IAdminMarketCardListingEntry[]> {
    const { data, error } = await this.client.from("market_card_listings").select("*").order("id", { ascending: true });
    if (error) throw new ValidationError("No se pudo leer listados de mercado admin.");
    return ((data ?? []) as IListingRow[]).map(mapListingRow);
  }

  async listPackPoolEntries(packPoolId: string): Promise<IAdminPackPoolEntry[]> {
    const { data, error } = await this.client.from("market_pack_pool_entries").select("*").eq("pack_pool_id", packPoolId).order("id", { ascending: true });
    if (error) throw new ValidationError("No se pudo leer el pool del pack.");
    return ((data ?? []) as IPoolEntryRow[]).map(mapPoolRow);
  }

  async listPacks(): Promise<IAdminMarketPackEntry[]> {
    const { data, error } = await this.client.from("market_pack_definitions").select("*").order("id", { ascending: true });
    if (error) throw new ValidationError("No se pudo leer packs de mercado admin.");
    const rows = (data ?? []) as IPackRow[];
    const packs = await Promise.all(rows.map(async (row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      priceNexus: row.price_nexus,
      cardsPerPack: row.cards_per_pack,
      packPoolId: row.pack_pool_id,
      previewCardIds: row.preview_card_ids,
      isAvailable: row.is_available,
      poolEntries: await this.listPackPoolEntries(row.pack_pool_id),
    })));
    return packs;
  }

  async upsertCard(command: IAdminUpsertCardCatalogCommand): Promise<void> {
    const { error } = await this.client.from("cards_catalog").upsert({
      id: command.id, name: command.name, description: command.description, type: command.type, faction: command.faction, cost: command.cost,
      attack: command.attack, defense: command.defense, archetype: command.archetype, trigger: command.trigger, bg_url: command.bgUrl, render_url: command.renderUrl,
      effect: command.effect, fusion_recipe_id: command.fusionRecipeId, fusion_material_ids: command.fusionMaterialIds, fusion_energy_requirement: command.fusionEnergyRequirement,
      is_active: command.isActive,
    });
    if (error) throw new ValidationError("No se pudo guardar la carta en catálogo.");
  }

  async upsertListing(command: IAdminUpsertMarketListingCommand): Promise<void> {
    const { error } = await this.client.from("market_card_listings").upsert({
      id: command.id, card_id: command.cardId, rarity: command.rarity, price_nexus: command.priceNexus, stock: command.stock, is_available: command.isAvailable,
    });
    if (error) throw new ValidationError("No se pudo guardar el listing de mercado.");
  }

  async upsertPack(command: IAdminUpsertMarketPackCommand): Promise<void> {
    const { error } = await this.client.from("market_pack_definitions").upsert({
      id: command.id, name: command.name, description: command.description, price_nexus: command.priceNexus, cards_per_pack: command.cardsPerPack,
      pack_pool_id: command.packPoolId, preview_card_ids: command.previewCardIds, is_available: command.isAvailable,
    });
    if (error) throw new ValidationError("No se pudo guardar la definición del pack.");
  }

  async deletePack(packId: string): Promise<void> {
    const packResult = await this.client.from("market_pack_definitions").select("pack_pool_id").eq("id", packId).maybeSingle<{ pack_pool_id: string }>();
    if (packResult.error) throw new ValidationError("No se pudo localizar el pack a eliminar.");
    if (!packResult.data) throw new ValidationError("El pack indicado no existe.");
    const poolDelete = await this.client.from("market_pack_pool_entries").delete().eq("pack_pool_id", packResult.data.pack_pool_id);
    if (poolDelete.error) throw new ValidationError("No se pudo eliminar el pool del pack.");
    const packDelete = await this.client.from("market_pack_definitions").delete().eq("id", packId);
    if (packDelete.error) throw new ValidationError("No se pudo eliminar el pack.");
  }

  async replacePackPoolEntries(packPoolId: string, entries: IAdminUpsertPackPoolEntryCommand[]): Promise<void> {
    const deleteResult = await this.client.from("market_pack_pool_entries").delete().eq("pack_pool_id", packPoolId);
    if (deleteResult.error) throw new ValidationError("No se pudo limpiar el pool actual del pack.");
    const insertResult = await this.client.from("market_pack_pool_entries").insert(
      entries.map((entry) => ({ id: entry.id, pack_pool_id: packPoolId, card_id: entry.cardId, rarity: entry.rarity, weight: entry.weight })),
    );
    if (insertResult.error) throw new ValidationError("No se pudo guardar el nuevo pool del pack.");
  }
}
