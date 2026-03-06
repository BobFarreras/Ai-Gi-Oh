import { ICard } from "@/core/entities/ICard";
import { FUSION_CARDS } from "@/core/data/mock-cards/fusions";

export function findFusionCardById(cardId: string): ICard | null {
  return FUSION_CARDS.find((card) => card.id === cardId) ?? null;
}
