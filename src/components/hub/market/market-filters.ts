// src/components/hub/market/market-filters.ts - Tipos de filtrado y orden para catálogo de cartas del mercado.
import { CardType } from "@/core/entities/ICard";

export type MarketTypeFilter = "ALL" | CardType;
export type MarketOrderField = "NAME" | "ATTACK" | "DEFENSE" | "ENERGY" | "PRICE";
export type MarketOrderDirection = "ASC" | "DESC";
