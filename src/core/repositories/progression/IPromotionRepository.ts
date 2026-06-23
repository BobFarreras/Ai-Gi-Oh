// src/core/repositories/progression/IPromotionRepository.ts - Contrato de lectura de promociones activas.
import { IFeaturedPromotion } from "@/core/entities/progression/IPromotion";

export interface IPromotionRepository {
  /** Promociones activas ahora mismo, ordenadas para mostrar. */
  getActive(): Promise<IFeaturedPromotion[]>;
}
