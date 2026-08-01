// src/core/use-cases/olympus/GetOlympusOverviewUseCase.test.ts - Verifica que el portal recibe allowance, desbloqueos y árbol ya compuestos.
import { describe, expect, it, vi } from "vitest";
import { IOlympusRepository } from "@/core/repositories/IOlympusRepository";
import { GetOlympusOverviewUseCase } from "./GetOlympusOverviewUseCase";
import { olympusCatalog, olympusProgress } from "./internal/olympus-test-doubles";

function repositoryWith(overrides: Partial<IOlympusRepository>): IOlympusRepository {
  return {
    getCatalog: vi.fn().mockResolvedValue(olympusCatalog),
    getUnlockedChampionIds: vi.fn().mockResolvedValue(["gennvim"]),
    getChampionProgress: vi.fn().mockResolvedValue([olympusProgress]),
    getDailyUsage: vi.fn().mockResolvedValue(null),
    getFragmentBalance: vi.fn().mockResolvedValue(320),
    getDefeatedLegendIds: vi.fn().mockResolvedValue([]),
    getIssuedBattle: vi.fn().mockResolvedValue(null),
    ...overrides,
  } as unknown as IOlympusRepository;
}

describe("GetOlympusOverviewUseCase", () => {
  it("consulta el uso del periodo UTC derivado en servidor", async () => {
    const repository = repositoryWith({});
    const overview = await new GetOlympusOverviewUseCase(repository)
      .execute("player-1", "2026-07-31T23:59:00.000Z");

    expect(repository.getDailyUsage).toHaveBeenCalledWith("player-1", "2026-07-31");
    expect(overview.allowance).toMatchObject({
      attemptsRemaining: 3,
      nextResetIso: "2026-08-01T00:00:00.000Z",
    });
  });

  it("adjunta a cada campeón su árbol y su estado de desbloqueo", async () => {
    const repository = repositoryWith({ getUnlockedChampionIds: vi.fn().mockResolvedValue([]) });
    const overview = await new GetOlympusOverviewUseCase(repository)
      .execute("player-1", "2026-07-31T10:00:00.000Z");

    expect(overview.champions).toHaveLength(1);
    expect(overview.champions[0]).toMatchObject({
      unlocked: false,
      nodes: [expect.objectContaining({ id: "gennvim-power-1" })],
    });
    expect(overview.ascensionFragments).toBe(320);
  });

  it("descuenta los intentos ya gastados hoy", async () => {
    const repository = repositoryWith({
      getDailyUsage: vi.fn().mockResolvedValue({ periodKey: "2026-07-31", attemptsUsed: 2, dailyLimit: 3 }),
    });
    const overview = await new GetOlympusOverviewUseCase(repository)
      .execute("player-1", "2026-07-31T10:00:00.000Z");

    expect(overview.allowance).toMatchObject({ attemptsUsed: 2, attemptsRemaining: 1 });
  });
});
