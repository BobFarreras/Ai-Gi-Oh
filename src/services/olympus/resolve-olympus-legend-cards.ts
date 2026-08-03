// src/services/olympus/resolve-olympus-legend-cards.ts - Resuelve la carta de botín de cada leyenda contra el catálogo real.
import { IOlympusLegend } from "@/core/entities/olympus/IOlympus";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";
import { loadAllActiveCards } from "@/infrastructure/persistence/supabase/internal/load-all-active-cards";

/** Lo justo para anunciar el botín: nombre y arte. La entrega la hace la RPC, no esto. */
export interface IOlympusRewardCard {
  id: string;
  name: string;
  renderUrl: string | null;
}

export interface IOlympusLegendCard extends IOlympusLegend {
  rewardCard: IOlympusRewardCard | null;
}

/**
 * El catálogo de verdad es `cards_catalog`, no el de código: una carta creada desde el panel de admin
 * existe en la tabla y no en `src/core/data/mock-cards`. Resolverla en cliente contra `CARD_BY_ID`
 * dejaba esas cartas sin anunciar —el jugador las recibía igual, pero no las veía venir—, así que el
 * servidor manda el nombre y el arte ya resueltos.
 */
export async function resolveOlympusLegendCards(legends: IOlympusLegend[]): Promise<IOlympusLegendCard[]> {
  const needsCatalog = legends.some((legend) => legend.cardRewardId !== null);
  if (!needsCatalog) return legends.map((legend) => ({ ...legend, rewardCard: null }));

  const cards = await loadAllActiveCards(createSupabaseServiceRoleClient());
  const cardById = new Map(cards.map((card) => [card.id, card] as const));
  return legends.map((legend) => {
    const card = legend.cardRewardId ? cardById.get(legend.cardRewardId) ?? null : null;
    return {
      ...legend,
      rewardCard: card ? { id: card.id, name: card.name, renderUrl: card.renderUrl ?? null } : null,
    };
  });
}
