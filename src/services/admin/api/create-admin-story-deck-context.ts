// src/services/admin/api/create-admin-story-deck-context.ts - Crea contexto admin Story Decks con repositorio y casos de uso para API.
import { NextRequest } from "next/server";
import { GetAdminStoryDeckDataUseCase } from "@/core/use-cases/admin/GetAdminStoryDeckDataUseCase";
import { SaveAdminStoryDeckUseCase } from "@/core/use-cases/admin/SaveAdminStoryDeckUseCase";
import { SupabaseAdminStoryDeckRepository } from "@/infrastructure/persistence/supabase/admin/SupabaseAdminStoryDeckRepository";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";
import { createAdminRouteContext } from "@/services/admin/api/create-admin-route-context";

export async function createAdminStoryDeckContext(request: NextRequest) {
  const routeContext = await createAdminRouteContext(request);
  const client = createSupabaseServiceRoleClient();
  const repository = new SupabaseAdminStoryDeckRepository(client);
  return {
    ...routeContext,
    repository,
    getDataUseCase: new GetAdminStoryDeckDataUseCase(repository),
    saveDeckUseCase: new SaveAdminStoryDeckUseCase(repository),
  };
}

