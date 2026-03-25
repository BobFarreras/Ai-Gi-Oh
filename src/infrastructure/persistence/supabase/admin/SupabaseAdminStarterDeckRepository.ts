// src/infrastructure/persistence/supabase/admin/SupabaseAdminStarterDeckRepository.ts - Implementa lectura/escritura de starter deck templates para panel admin.
import { SupabaseClient } from "@supabase/supabase-js";
import { ICard } from "@/core/entities/ICard";
import { ValidationError } from "@/core/errors/ValidationError";
import {
  IAdminStarterDeckTemplate,
  IAdminStarterDeckTemplateSummary,
} from "@/core/entities/admin/IAdminStarterDeckTemplate";
import { IAdminStarterDeckRepository } from "@/core/repositories/admin/IAdminStarterDeckRepository";
import { HOME_DECK_SIZE } from "@/core/services/home/deck-rules";
import { CARD_CATALOG_SELECT, ICardCatalogRow } from "@/infrastructure/persistence/supabase/internal/card-catalog-row";
import { loadCardsByIds } from "@/infrastructure/persistence/supabase/internal/load-cards-by-ids";
import { mapCardCatalogRowToCard } from "@/infrastructure/persistence/supabase/internal/map-card-catalog-row-to-card";

interface IStarterDeckTemplateRow {
  template_key: string;
  slot_index: number;
  card_id: string;
  is_active: boolean;
}

function resolveTemplateSummaries(rows: IStarterDeckTemplateRow[]): IAdminStarterDeckTemplateSummary[] {
  const summaryMap = new Map<string, boolean>();
  for (const row of rows) {
    summaryMap.set(row.template_key, (summaryMap.get(row.template_key) ?? false) || row.is_active);
  }
  return Array.from(summaryMap.entries())
    .map(([templateKey, isActive]) => ({ templateKey, isActive }))
    .sort((left, right) => left.templateKey.localeCompare(right.templateKey));
}

export class SupabaseAdminStarterDeckRepository implements IAdminStarterDeckRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listTemplateSummaries(): Promise<IAdminStarterDeckTemplateSummary[]> {
    const { data, error } = await this.client.from("starter_deck_template_slots").select("template_key,slot_index,card_id,is_active");
    if (error) throw new ValidationError("No se pudieron listar plantillas starter.");
    return resolveTemplateSummaries((data ?? []) as IStarterDeckTemplateRow[]);
  }

  async getTemplate(templateKey: string): Promise<IAdminStarterDeckTemplate | null> {
    const { data, error } = await this.client
      .from("starter_deck_template_slots")
      .select("template_key,slot_index,card_id,is_active")
      .eq("template_key", templateKey)
      .order("slot_index", { ascending: true });
    if (error) throw new ValidationError("No se pudo cargar la plantilla starter solicitada.");
    const rows = (data ?? []) as IStarterDeckTemplateRow[];
    if (rows.length === 0) return null;
    if (rows.length !== HOME_DECK_SIZE) throw new ValidationError("La plantilla starter no tiene 20 slots.");
    const cardsById = await loadCardsByIds(this.client, rows.map((row) => row.card_id));
    return {
      templateKey,
      isActive: rows.some((row) => row.is_active),
      slots: rows.map((row) => ({ slotIndex: row.slot_index, cardId: row.card_id, card: cardsById.get(row.card_id) ?? null })),
    };
  }

  async saveTemplate(templateKey: string, cardIds: string[]): Promise<void> {
    const payload = cardIds.map((cardId, slotIndex) => ({ template_key: templateKey, slot_index: slotIndex, card_id: cardId }));
    const { error } = await this.client.from("starter_deck_template_slots").upsert(payload, { onConflict: "template_key,slot_index" });
    if (error) throw new ValidationError(`No se pudo guardar la plantilla starter. (${error.message})`);
  }

  async activateTemplate(templateKey: string): Promise<void> {
    const disableResult = await this.client.from("starter_deck_template_slots").update({ is_active: false }).neq("template_key", templateKey);
    if (disableResult.error) throw new ValidationError(`No se pudieron desactivar plantillas starter previas. (${disableResult.error.message})`);
    const enableResult = await this.client.from("starter_deck_template_slots").update({ is_active: true }).eq("template_key", templateKey);
    if (enableResult.error) throw new ValidationError(`No se pudo activar la plantilla starter seleccionada. (${enableResult.error.message})`);
  }

  async listAvailableCards(): Promise<ICard[]> {
    const { data, error } = await this.client.from("cards_catalog").select(CARD_CATALOG_SELECT).eq("is_active", true).order("name", { ascending: true });
    if (error) throw new ValidationError("No se pudo cargar catálogo de cartas disponibles.");
    return ((data ?? []) as ICardCatalogRow[]).map((row) => mapCardCatalogRowToCard(row));
  }
}
