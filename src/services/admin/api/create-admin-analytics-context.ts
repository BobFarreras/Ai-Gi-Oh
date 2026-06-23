// src/services/admin/api/create-admin-analytics-context.ts - Fabrica contexto de analytics admin con caso de uso y repositorio desacoplados de la ruta.
import { NextRequest } from "next/server";
import { GetAnalyticsDashboardUseCase } from "@/core/use-cases/analytics/GetAnalyticsDashboardUseCase";
import { SupabaseAnalyticsReadRepository } from "@/infrastructure/persistence/supabase/SupabaseAnalyticsReadRepository";
import { createSupabaseRouteClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-route-client";
import { createAdminRouteContext } from "@/services/admin/api/create-admin-route-context";

export async function createAdminAnalyticsContext(request: NextRequest) {
  const routeContext = await createAdminRouteContext(request);
  const response = routeContext.response;
  const client = createSupabaseRouteClient(request, response);
  const repository = new SupabaseAnalyticsReadRepository(client);
  return {
    ...routeContext,
    getDashboardUseCase: new GetAnalyticsDashboardUseCase(repository),
  };
}
