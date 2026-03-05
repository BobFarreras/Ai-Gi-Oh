// src/core/repositories/IMarketRepository.ts - Contrato de lectura de catálogo de cartas y sobres del mercado.
import { IMarketCardListing } from "@/core/entities/market/IMarketCardListing";
import { IMarketPackDefinition } from "@/core/entities/market/IMarketPackDefinition";
import { IPackCardEntry } from "@/core/entities/market/IPackCardEntry";

export interface IMarketRepository {
  getCardListings(): Promise<IMarketCardListing[]>;
  getPackDefinitions(): Promise<IMarketPackDefinition[]>;
  getPackPoolEntries(packPoolId: string): Promise<IPackCardEntry[]>;
}
