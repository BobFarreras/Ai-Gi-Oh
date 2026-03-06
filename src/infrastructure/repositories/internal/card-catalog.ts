// src/infrastructure/repositories/internal/card-catalog.ts - Catálogo unificado de cartas mock para mapear IDs persistidos a entidades de dominio.
import { ENTITY_CARDS } from "@/core/data/mock-cards/entities";
import { EXECUTION_CARDS } from "@/core/data/mock-cards/executions";
import { FUSION_CARDS } from "@/core/data/mock-cards/fusions";
import { TRAP_CARDS } from "@/core/data/mock-cards/traps";
import { ICard } from "@/core/entities/ICard";

export const CARD_CATALOG: ICard[] = [...ENTITY_CARDS, ...EXECUTION_CARDS, ...TRAP_CARDS, ...FUSION_CARDS];
export const CARD_BY_ID = new Map<string, ICard>(CARD_CATALOG.map((card) => [card.id, card]));
