// src/infrastructure/persistence/supabase/SupabaseDeckRepository.ts - Repositorio de deck persistido por slots y acceso a colección integrada.
import { SupabaseClient } from "@supabase/supabase-js";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IDeck } from "@/core/entities/home/IDeck";
import { ValidationError } from "@/core/errors/ValidationError";
import { ICardCollectionRepository } from "@/core/repositories/ICardCollectionRepository";
import { IDeckRepository } from "@/core/repositories/IDeckRepository";

interface IDeckSlotRow {
  player_id: string;
  slot_index: number;
  card_id: string | null;
}

function createDefaultDeckSlots(playerId: string): IDeckSlotRow[] {
  return Array.from({ length: 20 }, (_, index) => ({ player_id: playerId, slot_index: index, card_id: null }));
}

export class SupabaseDeckRepository implements IDeckRepository {
  constructor(
    private readonly client: SupabaseClient,
    private readonly collectionRepository: ICardCollectionRepository,
  ) {}

  async getDeck(playerId: string): Promise<IDeck> {
    const { data, error } = await this.client
      .from("player_deck_slots")
      .select("player_id,slot_index,card_id")
      .eq("player_id", playerId)
      .order("slot_index", { ascending: true });
    if (error) throw new ValidationError("No se pudo cargar el deck del jugador.");
    let rows = data as IDeckSlotRow[];
    if (rows.length === 0) {
      const { error: insertError } = await this.client.from("player_deck_slots").insert(createDefaultDeckSlots(playerId));
      if (insertError) throw new ValidationError("No se pudo inicializar el deck del jugador.");
      const { data: insertedRows, error: readBackError } = await this.client
        .from("player_deck_slots")
        .select("player_id,slot_index,card_id")
        .eq("player_id", playerId)
        .order("slot_index", { ascending: true });
      if (readBackError) throw new ValidationError("No se pudo cargar el deck inicializado del jugador.");
      rows = insertedRows as IDeckSlotRow[];
    }
    const slots = rows.map((row) => ({ index: row.slot_index, cardId: row.card_id }));
    return { playerId, slots };
  }

  async saveDeck(deck: IDeck): Promise<void> {
    for (const slot of deck.slots) {
      const { error } = await this.client
        .from("player_deck_slots")
        .update({ card_id: slot.cardId })
        .eq("player_id", deck.playerId)
        .eq("slot_index", slot.index);
      if (error) throw new ValidationError("No se pudo guardar el deck del jugador.");
    }
  }

  async getCollection(playerId: string): Promise<ICollectionCard[]> {
    return this.collectionRepository.getCollection(playerId);
  }
}
