// src/components/hub/market/market-filters.ts - Tipos de filtrado y orden para catálogo de cartas del mercado.
import { CardType } from "@/core/entities/ICard";

/**
 * "ITEMS" no es un tipo de carta: es la pestaña de OBJETOS (caramelos USB Raro y, más adelante, las mejoras de
 * ATK/DEF). Los objetos no tienen ATK/DEF ni se invocan, así que no se pueden colar como una carta más en el
 * listado: al seleccionarlo, el mercado cambia de panel.
 */
export type MarketTypeFilter = "ALL" | CardType | "ITEMS";
export type MarketOrderField = "NAME" | "ATTACK" | "DEFENSE" | "ENERGY" | "PRICE";
export type MarketOrderDirection = "ASC" | "DESC";
