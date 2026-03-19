// src/components/hub/academy/tutorial/nodes/market/internal/create-tutorial-market-mock-data.ts - Construye catálogo mock estable para enseñar Market sin tocar persistencia real.
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IMarketCardListing } from "@/core/entities/market/IMarketCardListing";
import { IMarketPackDefinition } from "@/core/entities/market/IMarketPackDefinition";
import { IMarketTransaction } from "@/core/entities/market/IMarketTransaction";
import { IMarketCatalog } from "@/core/use-cases/market/GetMarketCatalogUseCase";
import { CARD_BY_ID } from "@/infrastructure/repositories/internal/card-catalog";

export interface ITutorialMarketMockData {
  catalog: IMarketCatalog;
  transactions: IMarketTransaction[];
  collection: ICollectionCard[];
  packPools: Record<string, string[]>;
}

function createListing(id: string, cardId: string, priceNexus: number, isAvailable: boolean): IMarketCardListing {
  const card = CARD_BY_ID.get(cardId);
  if (!card) throw new Error(`Carta no encontrada en catálogo mock: ${cardId}`);
  return {
    id,
    card,
    rarity: card.type === "FUSION" ? "LEGENDARY" : card.cost >= 5 ? "EPIC" : "RARE",
    priceNexus,
    stock: null,
    isAvailable,
  };
}

function createPack(
  id: string,
  name: string,
  description: string,
  priceNexus: number,
  cardsPerPack: number,
  previewCardIds: string[],
): IMarketPackDefinition {
  return {
    id,
    name,
    description,
    priceNexus,
    cardsPerPack,
    packPoolId: id,
    previewCardIds,
    isAvailable: true,
  };
}

/**
 * Expone un entorno de mercado controlado para tutorial: listado, packs, almacén e historial de ejemplo.
 */
export function createTutorialMarketMockData(): ITutorialMarketMockData {
  const listings = [
    createListing("tutorial-market-listing-chatgpt", "entity-chatgpt", 420, true),
    createListing("tutorial-market-listing-gemini", "entity-gemini", 410, true),
    createListing("tutorial-market-listing-nextjs", "entity-nextjs", 250, true),
    createListing("tutorial-market-listing-react", "entity-react", 230, true),
    createListing("tutorial-market-listing-fusion-magic", "exec-fusion-gemgpt", 360, true),
    createListing("tutorial-market-listing-gemgpt", "fusion-gemgpt", 0, false),
  ];
  const packs = [
    createPack(
      "tutorial-market-pack-gemgpt",
      "Pack GemGPT",
      "Pool centrado en materiales LLM y la mágica de fusión.",
      650,
      3,
      ["entity-chatgpt", "entity-gemini", "exec-fusion-gemgpt", "entity-nextjs"],
    ),
    createPack(
      "tutorial-market-pack-framework",
      "Pack Framework",
      "Pool orientado a cartas de desarrollo web y soporte.",
      480,
      3,
      ["entity-react", "entity-nextjs", "entity-vscode", "entity-git"],
    ),
  ];
  const collection: ICollectionCard[] = [
    { card: CARD_BY_ID.get("entity-vscode")!, ownedCopies: 2 },
    { card: CARD_BY_ID.get("entity-git")!, ownedCopies: 3 },
  ];
  const transactions: IMarketTransaction[] = [
    {
      id: "tutorial-market-tx-seed",
      playerId: "tutorial-player",
      transactionType: "BUY_CARD",
      amountNexus: 180,
      purchasedItemId: "tutorial-market-listing-react",
      purchasedCardIds: ["entity-react"],
      createdAtIso: "2026-03-16T10:00:00.000Z",
    },
  ];
  return {
    catalog: {
      wallet: { playerId: "tutorial-player", nexus: 2800 },
      listings,
      packs,
    },
    collection,
    transactions,
    packPools: {
      "tutorial-market-pack-gemgpt": ["entity-chatgpt", "entity-gemini", "exec-fusion-gemgpt", "entity-nextjs", "entity-react"],
      "tutorial-market-pack-framework": ["entity-react", "entity-nextjs", "entity-vscode", "entity-git", "entity-vercel"],
    },
  };
}
