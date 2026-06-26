// src/core/repositories/progression/IProgressionAdminRepository.ts - Contrato admin de lectura/escritura de definiciones de live-ops (misiones, eventos, login y promociones).
import {
  IAdminEvent,
  IAdminEventRule,
  IAdminEventShopItem,
  IAdminLoginRewardDay,
  IAdminMissionDefinition,
  IAdminPromotionConfig,
  ILiveOpsAdminData,
} from "@/core/entities/progression/ILiveOpsAdmin";

export interface IProgressionAdminRepository {
  /** Lee todas las definiciones de live-ops para el panel admin. */
  getLiveOps(): Promise<ILiveOpsAdminData>;
  upsertMission(mission: IAdminMissionDefinition): Promise<void>;
  upsertPromotion(promotion: IAdminPromotionConfig): Promise<void>;
  upsertEvent(event: Omit<IAdminEvent, "rules" | "items" | "missions">): Promise<void>;
  upsertEventRule(rule: IAdminEventRule): Promise<void>;
  upsertEventShopItem(item: IAdminEventShopItem): Promise<void>;
  upsertLoginRewardDay(day: IAdminLoginRewardDay): Promise<void>;
  /** Elimina una definición de misión por id. */
  deleteMission(id: string): Promise<void>;
  /** Elimina una regla de puntos de un evento (clave compuesta evento+acción). */
  deleteEventRule(eventId: string, actionType: string): Promise<void>;
}
