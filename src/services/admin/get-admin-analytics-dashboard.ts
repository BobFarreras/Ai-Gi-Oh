// src/services/admin/get-admin-analytics-dashboard.ts - Servicio server-side para obtener dashboard de analytics con acceso admin validado.
import { IAnalyticsDashboard } from "@/core/entities/analytics/IAnalyticsDashboard";
import { GetAnalyticsDashboardUseCase } from "@/core/use-cases/analytics/GetAnalyticsDashboardUseCase";
import { SupabaseAnalyticsReadRepository } from "@/infrastructure/persistence/supabase/SupabaseAnalyticsReadRepository";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";
import { assertAdminAccess } from "@/services/admin/assert-admin-access";

/**
 * Requiere sesión admin y devuelve el dashboard de analytics (últimos 30 días).
 */
export async function getAdminAnalyticsDashboard(): Promise<IAnalyticsDashboard> {
  await assertAdminAccess();
  const repository = new SupabaseAnalyticsReadRepository(createSupabaseServiceRoleClient());
  const useCase = new GetAnalyticsDashboardUseCase(repository);
  return useCase.execute();
}
