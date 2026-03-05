// src/services/player-persistence/internal/can-use-supabase-market-catalog.ts - Verifica disponibilidad del esquema de catálogo de mercado en Supabase.
import { SupabaseClient } from "@supabase/supabase-js";

export async function canUseSupabaseMarketCatalog(client: SupabaseClient): Promise<boolean> {
  const [listingCheck, packCheck, poolCheck, cardCatalogCheck] = await Promise.all([
    client.from("market_card_listings").select("id").limit(1),
    client.from("market_pack_definitions").select("id").limit(1),
    client.from("market_pack_pool_entries").select("id").limit(1),
    client.from("cards_catalog").select("id").limit(1),
  ]);
  const hasRows =
    (listingCheck.data?.length ?? 0) > 0 &&
    (packCheck.data?.length ?? 0) > 0 &&
    (poolCheck.data?.length ?? 0) > 0 &&
    (cardCatalogCheck.data?.length ?? 0) > 0;
  return !listingCheck.error && !packCheck.error && !poolCheck.error && !cardCatalogCheck.error && hasRows;
}
