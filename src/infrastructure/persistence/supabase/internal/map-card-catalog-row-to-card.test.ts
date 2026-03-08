// src/infrastructure/persistence/supabase/internal/map-card-catalog-row-to-card.test.ts - Tests del mapper de filas Supabase a entidad ICard.
import { describe, expect, it } from "vitest";
import { ICardCatalogRow } from "@/infrastructure/persistence/supabase/internal/card-catalog-row";
import { mapCardCatalogRowToCard } from "@/infrastructure/persistence/supabase/internal/map-card-catalog-row-to-card";

function createBaseRow(): ICardCatalogRow {
  return {
    id: "entity-test",
    name: "Entidad Test",
    description: "Descripción test",
    type: "ENTITY",
    faction: "OPEN_SOURCE",
    cost: 3,
    attack: 1200,
    defense: 1100,
    archetype: "TOOL",
    trigger: null,
    bg_url: "/assets/bgs/bg-tech.jpg",
    render_url: "/assets/renders/test.png",
    effect: null,
    fusion_recipe_id: null,
    fusion_material_ids: [],
    fusion_energy_requirement: null,
  };
}

describe("mapCardCatalogRowToCard", () => {
  it("mapea datos base de carta con stats y render", () => {
    const card = mapCardCatalogRowToCard(createBaseRow());
    expect(card.id).toBe("entity-test");
    expect(card.attack).toBe(1200);
    expect(card.defense).toBe(1100);
    expect(card.renderUrl).toBe("/assets/renders/test.png");
  });

  it("mapea efecto y metadatos de fusión cuando existen", () => {
    const card = mapCardCatalogRowToCard({
      ...createBaseRow(),
      id: "fusion-test",
      type: "FUSION",
      effect: { action: "FUSION_SUMMON", recipeId: "fusion-test", materialsRequired: 2 },
      fusion_recipe_id: "fusion-test",
      fusion_material_ids: ["entity-a", "entity-b"],
      fusion_energy_requirement: 8,
    });
    expect(card.effect).toEqual({ action: "FUSION_SUMMON", recipeId: "fusion-test", materialsRequired: 2 });
    expect(card.fusionRecipeId).toBe("fusion-test");
    expect(card.fusionMaterials).toEqual(["entity-a", "entity-b"]);
    expect(card.fusionEnergyRequirement).toBe(8);
  });

  it("mapea efectos avanzados de recuperación y contra-trampa", () => {
    const recovery = mapCardCatalogRowToCard({
      ...createBaseRow(),
      id: "exec-recovery",
      type: "EXECUTION",
      effect: { action: "RETURN_GRAVEYARD_CARD_TO_HAND", cardType: "ENTITY" },
    });
    const counterTrap = mapCardCatalogRowToCard({
      ...createBaseRow(),
      id: "trap-counter",
      type: "TRAP",
      trigger: "ON_OPPONENT_TRAP_ACTIVATED",
      effect: { action: "NEGATE_OPPONENT_TRAP_AND_DESTROY" },
    });
    expect(recovery.effect).toEqual({ action: "RETURN_GRAVEYARD_CARD_TO_HAND", cardType: "ENTITY" });
    expect(counterTrap.effect).toEqual({ action: "NEGATE_OPPONENT_TRAP_AND_DESTROY" });
  });
});
