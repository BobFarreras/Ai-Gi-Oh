// src/core/entities/market/IPackCardEntry.ts - Define entradas de un pool de sobre con probabilidad ponderada.
import { ICard } from "@/core/entities/ICard";
import { MarketRarity } from "@/core/entities/market/IMarketRarity";

export interface IPackCardEntry {
  id: string;
  card: ICard;
  rarity: MarketRarity;
  weight: number;
}
