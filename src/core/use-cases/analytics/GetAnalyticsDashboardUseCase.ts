// src/core/use-cases/analytics/GetAnalyticsDashboardUseCase.ts - Delega obtención del snapshot de analytics al repositorio de lectura.
import { IAnalyticsDashboard } from "@/core/entities/analytics/IAnalyticsDashboard";
import { IAnalyticsReadRepository } from "@/core/repositories/analytics/IAnalyticsReadRepository";

export class GetAnalyticsDashboardUseCase {
  constructor(private readonly repository: IAnalyticsReadRepository) {}

  /** Obtiene el dashboard completo de analytics (últimos 30 días). */
  async execute(): Promise<IAnalyticsDashboard> {
    return this.repository.getDashboard();
  }
}
