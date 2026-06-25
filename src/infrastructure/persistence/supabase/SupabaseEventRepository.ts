// src/infrastructure/persistence/supabase/SupabaseEventRepository.ts - Lee el evento activo (RPC get_event_overview) y canjea items (RPC redeem_event_shop_item).
import { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/core/errors/ValidationError";
import { IEventEarnRule, IEventOverview, IEventRedeemResult, IEventShopItem } from "@/core/entities/progression/IEvent";
import { IEventRepository } from "@/core/repositories/progression/IEventRepository";

interface IRawOverview {
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

export class SupabaseEventRepository implements IEventRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getOverview(): Promise<IEventOverview | null> {
    const { data, error } = await this.client.rpc("get_event_overview");
    if (error || !data) return null;
    const raw = data as IRawOverview;
    return {
      eventId: raw.eventId,
      name: raw.name,
      description: raw.description,
      currencyName: raw.currencyName,
      bannerUrl: raw.bannerUrl,
      endsAt: raw.endsAt,
      points: raw.points,
      spentPoints: raw.spentPoints,
      balance: raw.balance,
      earnRules: raw.earnRules ?? [],
      items: raw.items ?? [],
    };
  }

  async redeem(itemId: string): Promise<IEventRedeemResult> {
    const { data, error } = await this.client.rpc("redeem_event_shop_item", { p_item_id: itemId });
    if (error || !data) {
      throw new ValidationError(error?.message ?? "No se pudo canjear el item de evento.");
    }
    const result = data as IEventRedeemResult;
    return { applied: result.applied, cardId: result.cardId, balance: result.balance };
  }
}
