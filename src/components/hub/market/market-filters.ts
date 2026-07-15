// src/components/hub/market/market-filters.ts - Tipos de filtrado y orden para catálogo de cartas del mercado.
import { CardType } from "@/core/entities/ICard";

export type MarketTypeFilter = "ALL" | CardType;

/**
 * El mercado tiene dos SECCIONES independientes, no un filtro más: las cartas (con sus tipos/orden) y los
 * objetos (caramelos USB Raro y, más adelante, mejoras de ATK/DEF). Los objetos no son cartas —ni ATK/DEF ni
 * invocación—, así que viven en su propio panel al que se llega con un botón dedicado.
 */
export type MarketSection = "CARDS" | "ITEMS";
export type MarketOrderField = "NAME" | "ATTACK" | "DEFENSE" | "ENERGY" | "PRICE";
export type MarketOrderDirection = "ASC" | "DESC";
