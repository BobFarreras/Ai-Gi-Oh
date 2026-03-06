// src/services/market/market-runtime-snapshot.ts - Tipos compartidos para respuestas de estado unificado del mercado.
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IMarketTransaction } from "@/core/entities/market/IMarketTransaction";
import { IMarketCatalog } from "@/core/use-cases/market/GetMarketCatalogUseCase";

export interface IMarketRuntimeSnapshot {
  catalog: IMarketCatalog;
  transactions: IMarketTransaction[];
  collection: ICollectionCard[];
}
