// src/services/admin/get-admin-analytics-dashboard.ts - Servicio server-side para obtener dashboard de analytics con acceso admin validado y emails enriquecidos (service_role).
import { SupabaseClient } from "@supabase/supabase-js";
import { IAnalyticsDashboard } from "@/core/entities/analytics/IAnalyticsDashboard";
import { GetAnalyticsDashboardUseCase } from "@/core/use-cases/analytics/GetAnalyticsDashboardUseCase";
import { SupabaseAnalyticsReadRepository } from "@/infrastructure/persistence/supabase/SupabaseAnalyticsReadRepository";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";
import { assertAdminAccess } from "@/services/admin/assert-admin-access";

/** Resuelve el email de cada usuario reciente vía función service_role (email = PII, nunca expuesto al cliente). */
async function enrichRecentUsersWithEmail(
  client: SupabaseClient,
  dashboard: IAnalyticsDashboard,
): Promise<IAnalyticsDashboard> {
  const ids = dashboard.recentUsers.map((user) => user.userId);
  if (ids.length === 0) return dashboard;
  const { data, error } = await client.rpc("analytics_user_emails", { p_ids: ids });
  if (error || !data) return dashboard;
  const emailById = new Map((data as { user_id: string; email: string | null }[]).map((row) => [row.user_id, row.email]));
  return {
    ...dashboard,
    recentUsers: dashboard.recentUsers.map((user) => ({ ...user, email: emailById.get(user.userId) ?? null })),
  };
}

/**
 * Requiere sesión admin y devuelve el dashboard de analytics (últimos 30 días) con emails resueltos.
 */
export async function getAdminAnalyticsDashboard(): Promise<IAnalyticsDashboard> {
  await assertAdminAccess();
  const client = createSupabaseServiceRoleClient();
  const repository = new SupabaseAnalyticsReadRepository(client);
  const useCase = new GetAnalyticsDashboardUseCase(repository);
  const dashboard = await useCase.execute();
  return enrichRecentUsersWithEmail(client, dashboard);
}
