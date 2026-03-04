// src/components/hub/home/home-filters.ts - Tipos de estado para filtrar y ordenar cartas del almacén en Mi Home.
import { CardType } from "@/core/entities/ICard";

export type HomeCollectionTypeFilter = "ALL" | CardType;
export type HomeCollectionOrderField = "NAME" | "ATTACK" | "DEFENSE" | "ENERGY";
export type HomeCollectionOrderDirection = "ASC" | "DESC";
