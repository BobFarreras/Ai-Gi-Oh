// src/infrastructure/persistence/supabase/internal/load-cards-by-ids.ts - Carga cartas del catálogo por id y devuelve mapa para hidratar repositorios.
import { SupabaseClient } from "@supabase/supabase-js";
import { ICard } from "@/core/entities/ICard";
import { ValidationError } from "@/core/errors/ValidationError";
import { CARD_CATALOG_SELECT, ICardCatalogRow } from "@/infrastructure/persistence/supabase/internal/card-catalog-row";
import { mapCardCatalogRowToCard } from "@/infrastructure/persistence/supabase/internal/map-card-catalog-row-to-card";

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

export async function loadCardsByIds(client: SupabaseClient, cardIds: string[]): Promise<Map<string, ICard>> {
  const normalizedIds = unique(cardIds);
  if (normalizedIds.length === 0) return new Map<string, ICard>();
  const { data, error } = await client.from("cards_catalog").select(CARD_CATALOG_SELECT).in("id", normalizedIds).eq("is_active", true);
  if (error) throw new ValidationError("No se pudo cargar el catálogo de cartas.");
  const rows = (data ?? []) as ICardCatalogRow[];
  return new Map<string, ICard>(rows.map((row) => [row.id, mapCardCatalogRowToCard(row)]));
}
