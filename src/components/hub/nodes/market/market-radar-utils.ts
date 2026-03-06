// src/components/hub/nodes/market/market-radar-utils.ts - Utilidades puras para generar ecos del radar de mercado.
import { IMarketRadarBlip } from "./market-radar-types";

export function generateRandomMarketBlips(count: number): IMarketRadarBlip[] {
  return Array.from({ length: count }).map(() => ({
    id: Math.random().toString(36).slice(2, 11),
    angle: Math.random() * 360,
    distance: 10 + Math.random() * 35,
    rarity: Math.random() > 0.8 ? "legendary" : Math.random() > 0.5 ? "epic" : "common",
  }));
}
