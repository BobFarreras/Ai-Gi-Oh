// src/core/use-cases/progression/GetActivePromotionsUseCase.ts - Obtiene las promociones/noticias activas del hub.
import { IFeaturedPromotion } from "@/core/entities/progression/IPromotion";
import { IPromotionRepository } from "@/core/repositories/progression/IPromotionRepository";

export class GetActivePromotionsUseCase {
  constructor(private readonly repository: IPromotionRepository) {}

  async execute(): Promise<IFeaturedPromotion[]> {
    return this.repository.getActive();
  }
}
