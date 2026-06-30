// src/infrastructure/repositories/internal/card-catalog.ts - Catálogo unificado de cartas mock para mapear IDs persistidos a entidades de dominio.
import { ENTITY_CARDS } from "@/core/data/mock-cards/entities";
import { EXECUTION_CARDS } from "@/core/data/mock-cards/executions";
import { FUSION_CARDS } from "@/core/data/mock-cards/fusions";
import { TRAP_CARDS } from "@/core/data/mock-cards/traps";
import { ICard } from "@/core/entities/ICard";
import { resolveInnatePassiveSkillId } from "@/core/services/progression/innate-passive-map";

// Inyecta la pasiva innata en el catálogo en código para que los oponentes (training/arena/tutoriales)
// apliquen el poder igual que las cartas cargadas desde la BD.
function withInnatePassive(card: ICard): ICard {
  const innatePassiveSkillId = resolveInnatePassiveSkillId(card.id);
  return innatePassiveSkillId ? { ...card, masteryPassiveSkillId: innatePassiveSkillId } : card;
}

export const CARD_CATALOG: ICard[] = [...ENTITY_CARDS, ...EXECUTION_CARDS, ...TRAP_CARDS, ...FUSION_CARDS].map(withInnatePassive);
export const CARD_BY_ID = new Map<string, ICard>(CARD_CATALOG.map((card) => [card.id, card]));
