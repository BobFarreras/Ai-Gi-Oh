// src/components/admin/internal/admin-card-catalog-entry-mapper.ts - Mapea entradas de catálogo admin al formato de carta de runtime.
import { IAdminCardCatalogEntry } from "@/core/entities/admin/IAdminCatalogSnapshot";
import { ICard } from "@/core/entities/ICard";

export function mapAdminCardCatalogEntryToCard(entry: IAdminCardCatalogEntry): ICard {
  return {
    id: entry.id,
    name: entry.name,
    description: entry.description,
    type: entry.type,
    faction: entry.faction,
    cost: entry.cost,
    attack: entry.attack ?? undefined,
    defense: entry.defense ?? undefined,
    archetype: entry.archetype ?? undefined,
    trigger: entry.trigger ?? undefined,
    bgUrl: entry.bgUrl ?? undefined,
    renderUrl: entry.renderUrl ?? undefined,
    effect: entry.effect as ICard["effect"],
    fusionRecipeId: entry.fusionRecipeId ?? undefined,
    fusionMaterials: entry.fusionMaterialIds,
    fusionEnergyRequirement: entry.fusionEnergyRequirement ?? undefined,
  };
}
