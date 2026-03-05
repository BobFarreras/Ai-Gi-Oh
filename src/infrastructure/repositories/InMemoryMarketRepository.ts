// src/infrastructure/repositories/InMemoryMarketRepository.ts - Repositorio mock del mercado con listados y sobres para fase inicial.
import { ENTITY_CARDS } from "@/core/data/mock-cards/entities";
import { EXECUTION_CARDS } from "@/core/data/mock-cards/executions";
import { FUSION_CARDS } from "@/core/data/mock-cards/fusions";
import { TRAP_CARDS } from "@/core/data/mock-cards/traps";
import { IMarketCardListing } from "@/core/entities/market/IMarketCardListing";
import { IMarketPackDefinition } from "@/core/entities/market/IMarketPackDefinition";
import { IPackCardEntry } from "@/core/entities/market/IPackCardEntry";
import { IMarketRepository } from "@/core/repositories/IMarketRepository";

const ALL_MARKET_CARDS = [...ENTITY_CARDS, ...EXECUTION_CARDS, ...TRAP_CARDS, ...FUSION_CARDS];

function resolveRarityFromCard(cardId: string, cost: number): "COMMON" | "RARE" | "EPIC" | "LEGENDARY" {
  if (cardId.startsWith("fusion-")) return "LEGENDARY";
  if (cost >= 5) return "EPIC";
  if (cost >= 4) return "RARE";
  return "COMMON";
}

const CARD_LISTINGS: IMarketCardListing[] = ALL_MARKET_CARDS.map((card, index) => ({
  id: `listing-${card.id}`,
  card,
  rarity: resolveRarityFromCard(card.id, card.cost),
  priceNexus: Math.max(20, card.cost * 25 + (card.type === "FUSION" ? 100 : 0)),
  stock: index % 7 === 0 ? 8 : null,
  isAvailable: true,
}));

const PACK_DEFINITIONS: IMarketPackDefinition[] = [
  {
    id: "pack-core-alpha",
    name: "Core Alpha Pack",
    description: "Pack básico de 5 cartas de la rotación actual.",
    priceNexus: 220,
    cardsPerPack: 5,
    packPoolId: "pool-core-alpha",
    isAvailable: true,
  },
];

const PACK_POOLS: Record<string, IPackCardEntry[]> = {
  "pool-core-alpha": ALL_MARKET_CARDS.slice(0, 20).map((card) => {
    const rarity = resolveRarityFromCard(card.id, card.cost);
    const weight = rarity === "COMMON" ? 70 : rarity === "RARE" ? 20 : rarity === "EPIC" ? 8 : 2;
    return {
      id: `pool-core-alpha-${card.id}`,
      card,
      rarity,
      weight,
    };
  }),
};

export class InMemoryMarketRepository implements IMarketRepository {
  async getCardListings(): Promise<IMarketCardListing[]> {
    return CARD_LISTINGS.map((listing) => ({ ...listing, card: listing.card }));
  }

  async getPackDefinitions(): Promise<IMarketPackDefinition[]> {
    return PACK_DEFINITIONS.map((pack) => ({ ...pack }));
  }

  async getPackPoolEntries(packPoolId: string): Promise<IPackCardEntry[]> {
    const entries = PACK_POOLS[packPoolId] ?? [];
    return entries.map((entry) => ({ ...entry, card: entry.card }));
  }
}
