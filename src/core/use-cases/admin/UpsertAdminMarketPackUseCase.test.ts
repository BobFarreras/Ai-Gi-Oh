// src/core/use-cases/admin/UpsertAdminMarketPackUseCase.test.ts - Verifica orden de persistencia y validación en upsert de packs admin.
import { describe, expect, it, vi } from "vitest";
import { IAdminCatalogRepository } from "@/core/repositories/admin/IAdminCatalogRepository";
import { UpsertAdminMarketPackUseCase } from "@/core/use-cases/admin/UpsertAdminMarketPackUseCase";

function createRepositoryMock(): IAdminCatalogRepository {
  return {
    listCards: vi.fn(),
    listListings: vi.fn(),
    listPacks: vi.fn(),
    listPackPoolEntries: vi.fn(),
    upsertCard: vi.fn(),
    upsertListing: vi.fn(),
    upsertPack: vi.fn(async () => undefined),
    deletePack: vi.fn(),
    replacePackPoolEntries: vi.fn(async () => undefined),
  };
}

describe("UpsertAdminMarketPackUseCase", () => {
  it("guarda pack y luego reemplaza pool", async () => {
    const repository = createRepositoryMock();
    const useCase = new UpsertAdminMarketPackUseCase(repository);
    const command = {
      id: "pack-core",
      name: "Pack Core",
      description: "Desc",
      priceNexus: 120,
      cardsPerPack: 3,
      packPoolId: "pool-core",
      previewCardIds: ["entity-1"],
      isAvailable: true,
      poolEntries: [{ id: "pool-core-1", cardId: "entity-1", rarity: "COMMON" as const, weight: 3 }],
    };
    await useCase.execute(command);
    expect(repository.upsertPack).toHaveBeenCalledTimes(1);
    expect(repository.replacePackPoolEntries).toHaveBeenCalledWith("pool-core", command.poolEntries);
  });
});
