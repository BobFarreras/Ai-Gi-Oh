// src/core/entities/progression/IEvent.ts - Contratos del evento activo, su tienda de canje y el resultado de canjear.

export interface IEventShopItem {
  itemId: string;
  cardId: string;
  costPoints: number;
  perPlayerLimit: number;
  owned: number;
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
  items: IEventShopItem[];
}

export interface IEventRedeemResult {
  applied: boolean;
  cardId: string;
  balance: number;
}
