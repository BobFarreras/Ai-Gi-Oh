// src/core/entities/admin/IAdminCatalogCommands.ts - Inputs de comando para operaciones administrativas de catálogo y mercado.
import { CardArchetype, CardType, Faction, TrapTrigger } from "@/core/entities/ICard";
import { MarketRarity } from "@/core/entities/market/IMarketRarity";

export interface IAdminUpsertCardCatalogCommand {
  id: string;
  name: string;
  description: string;
  type: CardType;
  faction: Faction;
  cost: number;
  attack: number | null;
  defense: number | null;
  archetype: CardArchetype | null;
  trigger: TrapTrigger | null;
  bgUrl: string | null;
  renderUrl: string | null;
  effect: unknown;
  fusionRecipeId: string | null;
  fusionMaterialIds: string[];
  fusionEnergyRequirement: number | null;
  isActive: boolean;
}

export interface IAdminUpsertMarketListingCommand {
  id: string;
  cardId: string;
  rarity: MarketRarity;
  priceNexus: number;
  stock: number | null;
  isAvailable: boolean;
}

export interface IAdminUpsertPackPoolEntryCommand {
  id: string;
  cardId: string;
  rarity: MarketRarity;
  weight: number;
}

export interface IAdminUpsertMarketPackCommand {
  id: string;
  name: string;
  description: string;
  priceNexus: number;
  cardsPerPack: number;
  packPoolId: string;
  previewCardIds: string[];
  isAvailable: boolean;
  poolEntries: IAdminUpsertPackPoolEntryCommand[];
}
