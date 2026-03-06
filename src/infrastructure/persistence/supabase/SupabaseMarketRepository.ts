// src/infrastructure/persistence/supabase/SupabaseMarketRepository.ts - Repositorio de catálogo/listados/packs de mercado cargado desde Supabase.
import { SupabaseClient } from "@supabase/supabase-js";
import { IMarketCardListing } from "@/core/entities/market/IMarketCardListing";
import { IMarketPackDefinition } from "@/core/entities/market/IMarketPackDefinition";
import { MarketRarity } from "@/core/entities/market/IMarketRarity";
import { IPackCardEntry } from "@/core/entities/market/IPackCardEntry";
import { ValidationError } from "@/core/errors/ValidationError";
import { IMarketRepository } from "@/core/repositories/IMarketRepository";
import { loadCardsByIds } from "@/infrastructure/persistence/supabase/internal/load-cards-by-ids";

interface IMarketListingRow {
  id: string;
  card_id: string;
  rarity: MarketRarity;
  price_nexus: number;
  stock: number | null;
  is_available: boolean;
}

interface IMarketPackRow {
  id: string;
  name: string;
  description: string;
  price_nexus: number;
  cards_per_pack: number;
  pack_pool_id: string;
  preview_card_ids: string[];
  is_available: boolean;
}

interface IMarketPoolEntryRow {
  id: string;
  pack_pool_id: string;
  card_id: string;
  rarity: MarketRarity;
  weight: number;
}

export class SupabaseMarketRepository implements IMarketRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getCardListings(): Promise<IMarketCardListing[]> {
    const listingsResult = await this.client.from("market_card_listings").select("id,card_id,rarity,price_nexus,stock,is_available");
    if (listingsResult.error) throw new ValidationError("No se pudo cargar listados de mercado.");
    const listingsRows = (listingsResult.data ?? []) as IMarketListingRow[];
    const cardsById = await loadCardsByIds(
      this.client,
      listingsRows.map((row) => row.card_id),
    );
    return listingsRows
      .map((row) => {
        const card = cardsById.get(row.card_id);
        if (!card) return null;
        return {
          id: row.id,
          card,
          rarity: row.rarity,
          priceNexus: row.price_nexus,
          stock: row.stock,
          isAvailable: row.is_available,
        };
      })
      .filter((entry): entry is IMarketCardListing => entry !== null);
  }

  async getPackDefinitions(): Promise<IMarketPackDefinition[]> {
    const { data, error } = await this.client
      .from("market_pack_definitions")
      .select("id,name,description,price_nexus,cards_per_pack,pack_pool_id,preview_card_ids,is_available");
    if (error) throw new ValidationError("No se pudieron cargar los sobres del mercado.");
    return ((data ?? []) as IMarketPackRow[]).map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      priceNexus: row.price_nexus,
      cardsPerPack: row.cards_per_pack,
      packPoolId: row.pack_pool_id,
      previewCardIds: row.preview_card_ids,
      isAvailable: row.is_available,
    }));
  }

  async getPackPoolEntries(packPoolId: string): Promise<IPackCardEntry[]> {
    const entriesResult = await this.client
      .from("market_pack_pool_entries")
      .select("id,pack_pool_id,card_id,rarity,weight")
      .eq("pack_pool_id", packPoolId);
    if (entriesResult.error) throw new ValidationError("No se pudo cargar el pool del sobre.");
    const poolRows = (entriesResult.data ?? []) as IMarketPoolEntryRow[];
    const cardsById = await loadCardsByIds(
      this.client,
      poolRows.map((row) => row.card_id),
    );
    return poolRows
      .map((row) => {
        const card = cardsById.get(row.card_id);
        if (!card) return null;
        return { id: row.id, card, rarity: row.rarity, weight: row.weight };
      })
      .filter((entry): entry is IPackCardEntry => entry !== null);
  }
}
