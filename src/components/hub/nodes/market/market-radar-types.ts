// src/components/hub/nodes/market/market-radar-types.ts - Tipos y constantes del radar 3D del nodo de mercado.
export const MARKET_SWEEP_DURATION = 4;

export interface IMarketRadarBlip {
  id: string;
  angle: number;
  distance: number;
  rarity: "common" | "epic" | "legendary";
}
