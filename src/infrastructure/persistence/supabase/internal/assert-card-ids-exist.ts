// src/infrastructure/persistence/supabase/internal/assert-card-ids-exist.ts - Valida que todos los card_id existan en cards_catalog antes de persistir operaciones.
import { SupabaseClient } from "@supabase/supabase-js";
import { NotFoundError } from "@/core/errors/NotFoundError";
import { loadCardsByIds } from "@/infrastructure/persistence/supabase/internal/load-cards-by-ids";

export async function assertCardIdsExist(client: SupabaseClient, cardIds: string[]): Promise<void> {
  const catalog = await loadCardsByIds(client, cardIds);
  const missingIds = Array.from(new Set(cardIds)).filter((cardId) => !catalog.has(cardId));
  if (missingIds.length > 0) throw new NotFoundError(`No existen en catálogo: ${missingIds.join(", ")}.`);
}
