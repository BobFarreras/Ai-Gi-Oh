// src/services/training/get-arena-catalog.ts - Carga el catálogo de arena (tiers + oponentes) desde la BD, con null como señal de "usar el catálogo en código".
import { IArenaOpponent } from "@/core/entities/training/IArenaOpponent";
import { ITrainingTierDefinition } from "@/core/entities/training/ITrainingTierDefinition";
import { SupabaseArenaCatalogRepository } from "@/infrastructure/persistence/supabase/SupabaseArenaCatalogRepository";
import { createSupabaseServerClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-server-client";

export interface IArenaCatalogData {
  /** null cuando no hay datos en BD: el caller cae al catálogo de tiers en código. */
  tiers: ITrainingTierDefinition[] | null;
  /** null cuando no hay datos en BD: el resolver cae a los presets en código. */
  opponents: Record<string, IArenaOpponent> | null;
}

/** Lee tiers y oponentes de arena de la BD una sola vez; ante cualquier fallo devuelve null (sin romper arena). */
export async function getArenaCatalog(): Promise<IArenaCatalogData> {
  try {
    const client = await createSupabaseServerClient();
    const repository = new SupabaseArenaCatalogRepository(client);
    const [tiers, opponents] = await Promise.all([repository.listTiers(), repository.listOpponents()]);
    return {
      tiers: tiers.length > 0 ? tiers : null,
      opponents: Object.keys(opponents).length > 0 ? opponents : null,
    };
  } catch {
    return { tiers: null, opponents: null };
  }
}
