// src/core/use-cases/admin/GetAdminCatalogSnapshotUseCase.test.ts - Verifica agregación de snapshot administrativo desde repositorio.
import { describe, expect, it, vi } from "vitest";
import { IAdminCatalogRepository } from "@/core/repositories/admin/IAdminCatalogRepository";
import { GetAdminCatalogSnapshotUseCase } from "@/core/use-cases/admin/GetAdminCatalogSnapshotUseCase";

describe("GetAdminCatalogSnapshotUseCase", () => {
  it("devuelve cards, listings y packs del repositorio", async () => {
    const repository: IAdminCatalogRepository = {
      listCards: vi.fn(async () => [{ id: "card-1", name: "Card", description: "Desc", type: "ENTITY" as const, faction: "OPEN_SOURCE" as const, cost: 1, attack: 1, defense: 1, archetype: null, trigger: null, bgUrl: null, renderUrl: null, effect: null, fusionRecipeId: null, fusionMaterialIds: [], fusionEnergyRequirement: null, isActive: true }]),
      listListings: vi.fn(async () => [{ id: "listing-1", cardId: "card-1", rarity: "COMMON" as const, priceNexus: 10, stock: null, isAvailable: true }]),
      listPacks: vi.fn(async () => [{ id: "pack-1", name: "Pack", description: "Desc", priceNexus: 20, cardsPerPack: 3, packPoolId: "pool-1", previewCardIds: ["card-1"], isAvailable: true, poolEntries: [] }]),
      listPackPoolEntries: vi.fn(),
      upsertCard: vi.fn(),
      upsertListing: vi.fn(),
      upsertPack: vi.fn(),
      deletePack: vi.fn(),
      replacePackPoolEntries: vi.fn(),
    };
    const useCase = new GetAdminCatalogSnapshotUseCase(repository);
    const snapshot = await useCase.execute();
    expect(snapshot.cards).toHaveLength(1);
    expect(snapshot.listings).toHaveLength(1);
    expect(snapshot.packs).toHaveLength(1);
  });
});
