// src/services/training/get-arena-catalog.ts - Carga el catálogo de arena (tiers + oponentes) desde la BD, con null como señal de "usar el catálogo en código".
import { ICard } from "@/core/entities/ICard";
import { IArenaOpponent } from "@/core/entities/training/IArenaOpponent";
import { ITrainingTierDefinition } from "@/core/entities/training/ITrainingTierDefinition";
import { SupabaseArenaCatalogRepository } from "@/infrastructure/persistence/supabase/SupabaseArenaCatalogRepository";
import { createSupabaseServerClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-server-client";
import { loadAllActiveCards } from "@/infrastructure/persistence/supabase/internal/load-all-active-cards";

export interface IArenaCatalogData {
  /** null cuando no hay datos en BD: el caller cae al catálogo de tiers en código. */
  tiers: ITrainingTierDefinition[] | null;
  /** null cuando no hay datos en BD: el resolver cae a los presets en código. */
  opponents: Record<string, IArenaOpponent> | null;
  /** Catálogo de cartas (todas las activas) para hidratar; null = el resolver usa el catálogo en código. */
  cardCatalog: Map<string, ICard> | null;
}

/** Lee tiers, oponentes y catálogo de cartas de arena una sola vez; ante cualquier fallo devuelve null (sin romper arena). */
export async function getArenaCatalog(): Promise<IArenaCatalogData> {
  try {
    const client = await createSupabaseServerClient();
    const repository = new SupabaseArenaCatalogRepository(client);
    const [tiers, opponents, allCards] = await Promise.all([repository.listTiers(), repository.listOpponents(), loadAllActiveCards(client)]);
    return {
      tiers: tiers.length > 0 ? tiers : null,
      opponents: Object.keys(opponents).length > 0 ? opponents : null,
      cardCatalog: allCards.length > 0 ? new Map(allCards.map((card) => [card.id, card])) : null,
    };
  } catch {
    return { tiers: null, opponents: null, cardCatalog: null };
  }
}
