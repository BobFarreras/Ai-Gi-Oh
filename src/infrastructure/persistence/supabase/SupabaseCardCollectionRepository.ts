// src/infrastructure/persistence/supabase/SupabaseCardCollectionRepository.ts - Repositorio de almacén del jugador con acumulación de copias por carta.
import { SupabaseClient } from "@supabase/supabase-js";
import { NotFoundError } from "@/core/errors/NotFoundError";
import { ValidationError } from "@/core/errors/ValidationError";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { ICardCollectionRepository } from "@/core/repositories/ICardCollectionRepository";
import { CARD_BY_ID } from "@/infrastructure/repositories/internal/card-catalog";

interface ICollectionRow {
  player_id: string;
  card_id: string;
  owned_copies: number;
}

export class SupabaseCardCollectionRepository implements ICardCollectionRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getCollection(playerId: string): Promise<ICollectionCard[]> {
    const { data, error } = await this.client
      .from("player_collection_cards")
      .select("player_id,card_id,owned_copies")
      .eq("player_id", playerId)
      .gt("owned_copies", 0);
    if (error) throw new ValidationError("No se pudo cargar el almacén del jugador.");
    return (data as ICollectionRow[])
      .map((row) => {
        const card = CARD_BY_ID.get(row.card_id);
        if (!card) return null;
        return { card, ownedCopies: row.owned_copies };
      })
      .filter((entry): entry is ICollectionCard => entry !== null);
  }

  async addCards(playerId: string, cardIds: string[]): Promise<void> {
    const groupedCounts = new Map<string, number>();
    for (const cardId of cardIds) {
      if (!CARD_BY_ID.has(cardId)) throw new NotFoundError(`La carta ${cardId} no existe en catálogo.`);
      groupedCounts.set(cardId, (groupedCounts.get(cardId) ?? 0) + 1);
    }
    for (const [cardId, increment] of groupedCounts.entries()) {
      const { data, error } = await this.client
        .from("player_collection_cards")
        .select("player_id,card_id,owned_copies")
        .eq("player_id", playerId)
        .eq("card_id", cardId)
        .maybeSingle<ICollectionRow>();
      if (error) throw new ValidationError("No se pudo leer el almacén para actualizar cartas.");
      if (!data) {
        const { error: insertError } = await this.client.from("player_collection_cards").insert({
          player_id: playerId,
          card_id: cardId,
          owned_copies: increment,
        });
        if (insertError) throw new ValidationError("No se pudo añadir una carta al almacén.");
        continue;
      }
      const { error: updateError } = await this.client
        .from("player_collection_cards")
        .update({ owned_copies: data.owned_copies + increment })
        .eq("player_id", playerId)
        .eq("card_id", cardId);
      if (updateError) throw new ValidationError("No se pudo actualizar copias de carta en el almacén.");
    }
  }
}
