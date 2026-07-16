// src/core/entities/progression/IEvent.ts - Contratos del evento activo, su tienda de canje y el resultado de canjear.

/** Tipo de premio de un item de la tienda de evento: una carta o un objeto del mercado. */
export type EventRewardKind = "CARD" | "LEVEL_CANDY" | "CARD_UPGRADE";

export interface IEventShopItem {
  itemId: string;
  rewardKind: EventRewardKind;
  /** Carta a otorgar (solo cuando rewardKind = CARD). */
  cardId: string | null;
  /** Id del objeto (caramelo o mejora) a otorgar (cuando rewardKind ≠ CARD). */
  objectId: string | null;
  /** Datos de presentación del objeto, resueltos por el servidor (null para cartas). */
  objectName: string | null;
  objectImageUrl: string | null;
  objectDetail: string | null;
  costPoints: number;
  perPlayerLimit: number;
  owned: number;
}

/** Cómo se ganan puntos en el evento: una acción otorga N puntos. */
export interface IEventEarnRule {
  actionType: string;
  pointsPer: number;
}

export interface IEventOverview {
  eventId: string;
  name: string;
  description: string | null;
  currencyName: string;
  bannerUrl: string | null;
  endsAt: string;
  points: number;
  spentPoints: number;
  balance: number;
  earnRules: IEventEarnRule[];
  items: IEventShopItem[];
}

export interface IEventRedeemResult {
  applied: boolean;
  rewardKind: EventRewardKind;
  cardId: string | null;
  objectId: string | null;
  balance: number;
}
