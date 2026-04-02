// src/services/story/api/create-story-world-interaction-route-context.ts - Crea contexto de interacción Story con repositorios y casos de uso necesarios para nodos virtuales.
import { NextRequest } from "next/server";
import { GetStoryWorldStateUseCase } from "@/core/use-cases/story/GetStoryWorldStateUseCase";
import { SupabaseOpponentRepository } from "@/infrastructure/persistence/supabase/SupabaseOpponentRepository";
import { SupabasePlayerStoryDuelProgressRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerStoryDuelProgressRepository";
import { SupabasePlayerStoryWorldRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerStoryWorldRepository";
import { createStoryRouteContext } from "@/services/story/api/create-story-route-context";

export async function createStoryWorldInteractionRouteContext(request: NextRequest) {
  const routeContext = await createStoryRouteContext(request);
  const { client } = routeContext.repositories;
  const opponentRepository = new SupabaseOpponentRepository(client);
  const duelProgressRepository = new SupabasePlayerStoryDuelProgressRepository(client);
  return {
    ...routeContext,
    storyWorldRepository: new SupabasePlayerStoryWorldRepository(client),
    worldStateUseCase: new GetStoryWorldStateUseCase(opponentRepository, duelProgressRepository),
  };
}
