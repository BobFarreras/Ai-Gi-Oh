// src/core/entities/progression/ILiveOpsAdmin.ts - Contratos admin para editar definiciones de live-ops (misiones y promociones) sin SQL.
import { MissionScope } from "@/core/entities/progression/IMission";
import { PromotionKind } from "@/core/entities/progression/IPromotion";

export interface IAdminMissionDefinition {
  id: string;
  scope: MissionScope;
  objectiveType: string;
  targetCount: number;
  rewardNexus: number;
  title: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface IAdminPromotionConfig {
  id: string;
  kind: PromotionKind;
  title: string;
  body: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface ILiveOpsAdminData {
  missions: IAdminMissionDefinition[];
  promotions: IAdminPromotionConfig[];
}
