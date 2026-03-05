// src/services/player-persistence/internal/can-use-supabase-market-catalog.ts - Verifica disponibilidad del esquema de catálogo de mercado en Supabase.
import { SupabaseClient } from "@supabase/supabase-js";

interface IMarketCatalogAvailabilityCache {
  value: boolean;
  expiresAt: number;
}

const CATALOG_CHECK_TTL_MS = 60_000;
let cachedAvailability: IMarketCatalogAvailabilityCache | null = null;

export async function canUseSupabaseMarketCatalog(client: SupabaseClient): Promise<boolean> {
  const now = Date.now();
  if (cachedAvailability && cachedAvailability.expiresAt > now) return cachedAvailability.value;
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
  const canUse = !listingCheck.error && !packCheck.error && !poolCheck.error && !cardCatalogCheck.error && hasRows;
  cachedAvailability = { value: canUse, expiresAt: now + CATALOG_CHECK_TTL_MS };
  return canUse;
}
