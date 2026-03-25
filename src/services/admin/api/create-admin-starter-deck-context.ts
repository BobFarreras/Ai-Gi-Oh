// src/services/admin/api/create-admin-starter-deck-context.ts - Construye contexto admin para endpoints starter deck con casos de uso dedicados.
import { NextRequest } from "next/server";
import { GetAdminStarterDeckTemplateUseCase } from "@/core/use-cases/admin/GetAdminStarterDeckTemplateUseCase";
import { SaveAdminStarterDeckTemplateUseCase } from "@/core/use-cases/admin/SaveAdminStarterDeckTemplateUseCase";
import { SupabaseAdminStarterDeckRepository } from "@/infrastructure/persistence/supabase/admin/SupabaseAdminStarterDeckRepository";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";
import { createAdminRouteContext } from "@/services/admin/api/create-admin-route-context";

export async function createAdminStarterDeckContext(request: NextRequest) {
  const routeContext = await createAdminRouteContext(request);
  const client = createSupabaseServiceRoleClient();
  const repository = new SupabaseAdminStarterDeckRepository(client);
  return {
    ...routeContext,
    repository,
    getTemplateUseCase: new GetAdminStarterDeckTemplateUseCase(repository),
    saveTemplateUseCase: new SaveAdminStarterDeckTemplateUseCase(repository),
  };
}
