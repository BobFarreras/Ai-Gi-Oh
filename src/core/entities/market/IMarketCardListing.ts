// src/core/entities/market/IMarketCardListing.ts - Define una carta vendible en mercado con precio Nexus y disponibilidad.
import { ICard } from "@/core/entities/ICard";
import { MarketRarity } from "@/core/entities/market/IMarketRarity";

export interface IMarketCardListing {
  id: string;
  card: ICard;
  rarity: MarketRarity;
  priceNexus: number;
  stock: number | null;
  isAvailable: boolean;
}
