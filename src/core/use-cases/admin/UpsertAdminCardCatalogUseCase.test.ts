// src/core/use-cases/admin/UpsertAdminCardCatalogUseCase.test.ts - Valida persistencia de carta admin y rechazo cuando el comando es inválido.
import { describe, expect, it, vi } from "vitest";
import { IAdminCatalogRepository } from "@/core/repositories/admin/IAdminCatalogRepository";
import { UpsertAdminCardCatalogUseCase } from "@/core/use-cases/admin/UpsertAdminCardCatalogUseCase";

function createRepository(): IAdminCatalogRepository {
  return {
    listCards: vi.fn(),
    listListings: vi.fn(),
    listPacks: vi.fn(),
    listPackPoolEntries: vi.fn(),
    upsertCard: vi.fn(async () => undefined),
    upsertListing: vi.fn(),
    upsertPack: vi.fn(),
    deletePack: vi.fn(),
    replacePackPoolEntries: vi.fn(),
  };
}

describe("UpsertAdminCardCatalogUseCase", () => {
  it("persiste comando válido", async () => {
    const repository = createRepository();
    const useCase = new UpsertAdminCardCatalogUseCase(repository);
    await useCase.execute({
      id: "entity-admin-card",
      name: "Card",
      description: "Desc",
      type: "ENTITY",
      faction: "OPEN_SOURCE",
      cost: 2,
      attack: 400,
      defense: 300,
      archetype: null,
      trigger: null,
      bgUrl: null,
      renderUrl: null,
      effect: null,
      fusionRecipeId: null,
      fusionMaterialIds: [],
      fusionEnergyRequirement: null,
      isActive: true,
    });
    expect(repository.upsertCard).toHaveBeenCalledTimes(1);
  });

  it("rechaza comando inválido", async () => {
    const repository = createRepository();
    const useCase = new UpsertAdminCardCatalogUseCase(repository);
    await expect(
      useCase.execute({
        id: "exec-invalid",
        name: "Spell",
        description: "Desc",
        type: "EXECUTION",
        faction: "OPEN_SOURCE",
        cost: 1,
        attack: 100,
        defense: 100,
        archetype: null,
        trigger: null,
        bgUrl: null,
        renderUrl: null,
        effect: null,
        fusionRecipeId: null,
        fusionMaterialIds: [],
        fusionEnergyRequirement: null,
        isActive: true,
      }),
    ).rejects.toBeTruthy();
  });
});
