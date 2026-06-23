// src/core/repositories/progression/IProgressionAdminRepository.ts - Contrato admin de lectura/escritura de definiciones de live-ops (misiones y promociones).
import { IAdminMissionDefinition, IAdminPromotionConfig, ILiveOpsAdminData } from "@/core/entities/progression/ILiveOpsAdmin";

export interface IProgressionAdminRepository {
  /** Lee todas las definiciones de live-ops para el panel admin. */
  getLiveOps(): Promise<ILiveOpsAdminData>;
  /** Crea o actualiza una definición de misión. */
  upsertMission(mission: IAdminMissionDefinition): Promise<void>;
  /** Crea o actualiza una promoción/noticia. */
  upsertPromotion(promotion: IAdminPromotionConfig): Promise<void>;
}
