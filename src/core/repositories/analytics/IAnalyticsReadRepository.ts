// src/core/repositories/analytics/IAnalyticsReadRepository.ts - Contrato de consulta de datos de analytics para dashboard admin read-only.
import { IAnalyticsDashboard } from "@/core/entities/analytics/IAnalyticsDashboard";

export interface IAnalyticsReadRepository {
  /** Obtiene el snapshot completo del dashboard de analytics (últimos 30 días). */
  getDashboard(): Promise<IAnalyticsDashboard>;
}
