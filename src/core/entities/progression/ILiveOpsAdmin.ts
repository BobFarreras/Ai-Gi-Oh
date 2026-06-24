// src/core/entities/progression/ILiveOpsAdmin.ts - Contratos admin para editar todas las definiciones de live-ops (misiones, eventos, login diario y promociones) sin SQL.
import { MissionScope } from "@/core/entities/progression/IMission";
import { PromotionKind } from "@/core/entities/progression/IPromotion";
import { LoginRewardType } from "@/core/entities/progression/ILoginStreak";

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

/** Regla de puntos de un evento: una acción otorga N puntos. */
export interface IAdminEventRule {
  eventId: string;
  actionType: string;
  pointsPer: number;
}

/** Item de la tienda de un evento. */
export interface IAdminEventShopItem {
  id: string;
  eventId: string;
  cardId: string;
  costPoints: number;
  perPlayerLimit: number;
  sortOrder: number;
  isActive: boolean;
}

/** Evento completo con sus reglas de puntos e items de tienda. */
export interface IAdminEvent {
  id: string;
  name: string;
  description: string | null;
  currencyName: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  rules: IAdminEventRule[];
  items: IAdminEventShopItem[];
}

/** Un día del calendario de recompensas de login. */
export interface IAdminLoginRewardDay {
  dayIndex: number;
  rewardType: LoginRewardType;
  rewardNexus: number;
  rewardCardId: string | null;
  label: string | null;
}

export interface ILiveOpsAdminData {
  missions: IAdminMissionDefinition[];
  promotions: IAdminPromotionConfig[];
  events: IAdminEvent[];
  loginCalendar: IAdminLoginRewardDay[];
}
