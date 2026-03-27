// src/core/services/admin/validate-admin-catalog-commands.test.ts - Cubre reglas de validación para comandos administrativos de catálogo/mercado.
import { describe, expect, it } from "vitest";
import { IAdminUpsertCardCatalogCommand, IAdminUpsertMarketPackCommand } from "@/core/entities/admin/IAdminCatalogCommands";
import { validateAdminCardCommand, validateAdminPackCommand } from "@/core/services/admin/validate-admin-catalog-commands";

function buildCardCommand(partial?: Partial<IAdminUpsertCardCatalogCommand>): IAdminUpsertCardCatalogCommand {
  return {
    id: "entity-test",
    name: "Carta Test",
    description: "Carta de prueba",
    type: "ENTITY",
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
    ...partial,
  };
}

function buildPackCommand(partial?: Partial<IAdminUpsertMarketPackCommand>): IAdminUpsertMarketPackCommand {
  return {
    id: "pack-test",
    name: "Pack Test",
    description: "Pack de prueba",
    priceNexus: 100,
    cardsPerPack: 3,
    packPoolId: "pool-test",
    previewCardIds: ["entity-test"],
    isAvailable: true,
    poolEntries: [{ id: "pool-test-1", cardId: "entity-test", rarity: "COMMON", weight: 10 }],
    ...partial,
  };
}

describe("validateAdminCardCommand", () => {
  it("acepta carta ENTITY con ataque/defensa", () => {
    expect(() => validateAdminCardCommand(buildCardCommand())).not.toThrow();
  });

  it("rechaza carta ENTITY sin ataque/defensa", () => {
    expect(() => validateAdminCardCommand(buildCardCommand({ attack: null, defense: null }))).toThrow();
  });
});

describe("validateAdminPackCommand", () => {
  it("acepta pack consistente con pool", () => {
    expect(() => validateAdminPackCommand(buildPackCommand())).not.toThrow();
  });

  it("rechaza entradas de pool con weight <= 0", () => {
    expect(() => validateAdminPackCommand(buildPackCommand({ poolEntries: [{ id: "x", cardId: "entity-test", rarity: "COMMON", weight: 0 }] }))).toThrow();
  });
});
