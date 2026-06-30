// src/infrastructure/persistence/supabase/internal/load-all-active-cards.ts - Carga todas las cartas activas del catálogo como entidades ICard (almacén admin, hidratación).
import { SupabaseClient } from "@supabase/supabase-js";
import { ICard } from "@/core/entities/ICard";
import { ValidationError } from "@/core/errors/ValidationError";
import { CARD_CATALOG_SELECT, ICardCatalogRow } from "@/infrastructure/persistence/supabase/internal/card-catalog-row";
import { mapCardCatalogRowToCard } from "@/infrastructure/persistence/supabase/internal/map-card-catalog-row-to-card";

/** Devuelve todas las cartas activas del juego (orden alfabético). */
export async function loadAllActiveCards(client: SupabaseClient): Promise<ICard[]> {
  const { data, error } = await client
    .from("cards_catalog")
    .select(CARD_CATALOG_SELECT)
    .eq("is_active", true)
    .order("name", { ascending: true });
  if (error) throw new ValidationError("No se pudo cargar el catálogo de cartas activas.");
  return ((data ?? []) as ICardCatalogRow[]).map((row) => mapCardCatalogRowToCard(row));
}
