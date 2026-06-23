// src/core/use-cases/analytics/GetAnalyticsDashboardUseCase.test.ts - Asegura que el use case delega correctamente al repositorio.
import { describe, expect, it, vi } from "vitest";
import { IAnalyticsDashboard } from "@/core/entities/analytics/IAnalyticsDashboard";
import { IAnalyticsReadRepository } from "@/core/repositories/analytics/IAnalyticsReadRepository";
import { GetAnalyticsDashboardUseCase } from "@/core/use-cases/analytics/GetAnalyticsDashboardUseCase";

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

describe("GetAnalyticsDashboardUseCase", () => {
  it("delega al repositorio y retorna el dashboard", async () => {
    const repository: IAnalyticsReadRepository = {
      getDashboard: vi.fn(async () => EMPTY_DASHBOARD),
    };
    const useCase = new GetAnalyticsDashboardUseCase(repository);
    const result = await useCase.execute();
    expect(repository.getDashboard).toHaveBeenCalledOnce();
    expect(result).toEqual(EMPTY_DASHBOARD);
  });

  it("propaga error del repositorio", async () => {
    const repository: IAnalyticsReadRepository = {
      getDashboard: vi.fn(async () => { throw new Error("DB error"); }),
    };
    const useCase = new GetAnalyticsDashboardUseCase(repository);
    await expect(useCase.execute()).rejects.toThrow("DB error");
  });
});
