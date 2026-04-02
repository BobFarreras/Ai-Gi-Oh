// src/services/story/api/create-story-duel-completion-route-context.ts - Prepara dependencias de dominio para cierre de duelo Story sin acoplar route.ts a infraestructura.
import { NextRequest } from "next/server";
import { SupabaseOpponentRepository } from "@/infrastructure/persistence/supabase/SupabaseOpponentRepository";
import { SupabasePlayerProgressRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerProgressRepository";
import { SupabasePlayerStoryDuelProgressRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerStoryDuelProgressRepository";
import { SupabasePlayerStoryWorldRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerStoryWorldRepository";
import { loadCardsByIds } from "@/infrastructure/persistence/supabase/internal/load-cards-by-ids";
import { createStoryRouteContext } from "@/services/story/api/create-story-route-context";

export async function createStoryDuelCompletionRouteContext(request: NextRequest) {
  const routeContext = await createStoryRouteContext(request);
  const { client } = routeContext.repositories;
  return {
    ...routeContext,
    opponentRepository: new SupabaseOpponentRepository(client),
    storyProgressRepository: new SupabasePlayerStoryDuelProgressRepository(client),
    storyWorldRepository: new SupabasePlayerStoryWorldRepository(client),
    playerProgressRepository: new SupabasePlayerProgressRepository(client),
    loadCardsByIds: (cardIds: string[]) => loadCardsByIds(client, cardIds),
  };
}
