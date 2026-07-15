// src/core/entities/progression/ILiveOpsAdmin.ts - Contratos admin para editar todas las definiciones de live-ops (misiones, eventos, login diario y promociones) sin SQL.
import { MissionScope } from "@/core/entities/progression/IMission";
import { PromotionKind } from "@/core/entities/progression/IPromotion";
import { LoginRewardType } from "@/core/entities/progression/ILoginStreak";

export interface IAdminMissionDefinition {
  id: string;
  scope: MissionScope;
  objectiveType: string;
  /** Umbral del objetivo de estado (nivel/versión); null en acciones y cantidades. */
  objectiveParam: number | null;
  targetCount: number;
  /** Importe de la recompensa (Nexus o puntos de evento según rewardType). */
  rewardNexus: number;
  rewardType: "NEXUS" | "EVENT_POINTS";
  /** Evento asociado (obligatorio si rewardType = EVENT_POINTS). */
  eventId: string | null;
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
  mediaUrl: string | null;
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

/** Tipo de premio de un item de tienda de evento: carta u objeto del mercado. */
export type AdminEventRewardKind = "CARD" | "LEVEL_CANDY" | "CARD_UPGRADE";

/** Item de la tienda de un evento: una carta (cardId) o un objeto del mercado (objectId). */
export interface IAdminEventShopItem {
  id: string;
  eventId: string;
  rewardKind: AdminEventRewardKind;
  /** Carta a otorgar (solo cuando rewardKind = CARD). */
  cardId: string | null;
  /** Id del caramelo/objeto de mejora (cuando rewardKind ≠ CARD). */
  objectId: string | null;
  costPoints: number;
  perPlayerLimit: number;
  sortOrder: number;
  isActive: boolean;
}

/** Evento completo con sus reglas de puntos, items de tienda y misiones propias. */
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
  missions: IAdminMissionDefinition[];
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
