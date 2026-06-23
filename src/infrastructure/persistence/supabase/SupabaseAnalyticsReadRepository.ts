// src/infrastructure/persistence/supabase/SupabaseAnalyticsReadRepository.ts - Lee el dashboard de analytics vía RPC de agregación server-side (sin tope de 1000 filas, KPIs siempre frescos).
import { SupabaseClient } from "@supabase/supabase-js";
import { IAnalyticsDashboard } from "@/core/entities/analytics/IAnalyticsDashboard";
import { IAnalyticsReadRepository } from "@/core/repositories/analytics/IAnalyticsReadRepository";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/** Dashboard vacío usado como fallback si la agregación falla (analytics nunca rompe el panel). */
const EMPTY_DASHBOARD: IAnalyticsDashboard = {
  dau: [],
  totalEvents30d: 0,
  totalSessions30d: 0,
  avgSessionDurationSeconds: null,
  topEvents: [],
  deviceDistribution: [],
  topPlayers: [],
  topCardsUsed: [],
  topCardsPurchased: [],
  recentUsers: [],
};

export class SupabaseAnalyticsReadRepository implements IAnalyticsReadRepository {
  constructor(private readonly client: SupabaseClient) {}

  /**
   * Obtiene el dashboard completo (últimos 30 días) en una sola llamada RPC.
   * La agregación corre en Postgres (public.analytics_dashboard), evitando el tope
   * de 1000 filas del cliente Supabase y el coste de traer eventos crudos al servidor Next.
   */
  async getDashboard(): Promise<IAnalyticsDashboard> {
    const since = new Date(Date.now() - THIRTY_DAYS_MS).toISOString();
    const { data, error } = await this.client.rpc("analytics_dashboard", { p_since: since });
    if (error || !data) return EMPTY_DASHBOARD;
    const snapshot = data as Partial<IAnalyticsDashboard>;
    return {
      dau: snapshot.dau ?? [],
      totalEvents30d: snapshot.totalEvents30d ?? 0,
      totalSessions30d: snapshot.totalSessions30d ?? 0,
      avgSessionDurationSeconds: snapshot.avgSessionDurationSeconds ?? null,
      topEvents: snapshot.topEvents ?? [],
      deviceDistribution: snapshot.deviceDistribution ?? [],
      topPlayers: snapshot.topPlayers ?? [],
      topCardsUsed: snapshot.topCardsUsed ?? [],
      topCardsPurchased: snapshot.topCardsPurchased ?? [],
      recentUsers: snapshot.recentUsers ?? [],
    };
  }
}
