// src/infrastructure/persistence/supabase/SupabaseStarterDeckTemplateRepository.ts - Lee plantilla activa del deck inicial desde Supabase.
import { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/core/errors/ValidationError";
import { IStarterDeckTemplateRepository } from "@/core/repositories/IStarterDeckTemplateRepository";
import { HOME_DECK_SIZE } from "@/core/services/home/deck-rules";

interface IStarterDeckSlotRow {
  template_key: string;
  slot_index: number;
  card_id: string;
}

export class SupabaseStarterDeckTemplateRepository implements IStarterDeckTemplateRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getActiveStarterDeckCardIds(templateKey: string): Promise<string[]> {
    const { data, error } = await this.client
      .from("starter_deck_template_slots")
      .select("template_key,slot_index,card_id")
      .eq("template_key", templateKey)
      .eq("is_active", true)
      .order("slot_index", { ascending: true });
    if (error) throw new ValidationError("No se pudo cargar la plantilla de deck inicial.");
    const rows = (data ?? []) as IStarterDeckSlotRow[];
    if (rows.length !== HOME_DECK_SIZE) {
      throw new ValidationError("La plantilla de deck inicial no contiene 20 slots activos.");
    }
    return rows.map((row) => row.card_id);
  }
}

