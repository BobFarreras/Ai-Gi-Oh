// src/core/entities/market/IMarketPackDefinition.ts - Define metadatos de sobres del mercado y su costo en Nexus.
export interface IMarketPackDefinition {
  id: string;
  name: string;
  description: string;
  priceNexus: number;
  cardsPerPack: number;
  packPoolId: string;
  previewCardIds: string[];
  isAvailable: boolean;
}
