// src/infrastructure/persistence/supabase/SupabaseCardCollectionRepository.ts - Repositorio de almacén del jugador con acumulación de copias por carta.
import { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/core/errors/ValidationError";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { ICardCollectionRepository } from "@/core/repositories/ICardCollectionRepository";
import { assertCardIdsExist } from "@/infrastructure/persistence/supabase/internal/assert-card-ids-exist";
import { loadCardsByIds } from "@/infrastructure/persistence/supabase/internal/load-cards-by-ids";

interface ICollectionRow {
  player_id: string;
  card_id: string;
  owned_copies: number;
}

function buildDbErrorContext(error: { code?: string; message?: string; details?: string | null; hint?: string | null }): string {
  const raw = [error.code, error.message, error.details ?? undefined, error.hint ?? undefined]
    .filter((value) => Boolean(value))
    .join(" | ");
  return raw ? ` (${raw})` : "";
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
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
    const collectionRows = data as ICollectionRow[];
    const cardsById = await loadCardsByIds(
      this.client,
      collectionRows.map((row) => row.card_id),
    );
    return collectionRows
      .map((row) => {
        const card = cardsById.get(row.card_id);
        if (!card) return null;
        return { card, ownedCopies: row.owned_copies };
      })
      .filter((entry): entry is ICollectionCard => entry !== null);
  }

  async addCards(playerId: string, cardIds: string[]): Promise<void> {
    const groupedCounts = new Map<string, number>();
    for (const cardId of cardIds) {
      groupedCounts.set(cardId, (groupedCounts.get(cardId) ?? 0) + 1);
    }
    await assertCardIdsExist(this.client, Array.from(groupedCounts.keys()));
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
        if (insertError) {
          // Mitiga carreras: si otro request insertó antes, esperamos commit y reintentamos como update.
          if (insertError.code === "23505") {
            let wasRecovered = false;
            for (let attempt = 0; attempt < 3; attempt += 1) {
              const { data: retryData, error: retryReadError } = await this.client
                .from("player_collection_cards")
                .select("player_id,card_id,owned_copies")
                .eq("player_id", playerId)
                .eq("card_id", cardId)
                .maybeSingle<ICollectionRow>();
              if (!retryReadError && retryData) {
                const { error: retryUpdateError } = await this.client
                  .from("player_collection_cards")
                  .update({ owned_copies: retryData.owned_copies + increment })
                  .eq("player_id", playerId)
                  .eq("card_id", cardId);
                if (!retryUpdateError) {
                  wasRecovered = true;
                  break;
                }
              }
              await wait(50 * (attempt + 1));
            }
            if (wasRecovered) continue;
          }
          throw new ValidationError(`No se pudo añadir una carta al almacén.${buildDbErrorContext(insertError)}`);
        }
        continue;
      }
      const { error: updateError } = await this.client
        .from("player_collection_cards")
        .update({ owned_copies: data.owned_copies + increment })
        .eq("player_id", playerId)
        .eq("card_id", cardId);
      if (updateError) {
        throw new ValidationError(`No se pudo actualizar copias de carta en el almacén.${buildDbErrorContext(updateError)}`);
      }
    }
  }

  async consumeCards(playerId: string, cardId: string, copies: number): Promise<void> {
    if (!Number.isInteger(copies) || copies <= 0) throw new ValidationError("La cantidad a consumir debe ser positiva.");
    const { data, error } = await this.client
      .from("player_collection_cards")
      .select("player_id,card_id,owned_copies")
      .eq("player_id", playerId)
      .eq("card_id", cardId)
      .maybeSingle<ICollectionRow>();
    if (error) throw new ValidationError("No se pudo leer el almacén para consumir copias.");
    if (!data || data.owned_copies < copies) {
      throw new ValidationError("No hay suficientes copias en el almacén para evolucionar.");
    }
    const nextCopies = data.owned_copies - copies;
    if (nextCopies === 0) {
      const { error: deleteError } = await this.client
        .from("player_collection_cards")
        .delete()
        .eq("player_id", playerId)
        .eq("card_id", cardId);
      if (deleteError) throw new ValidationError("No se pudo consumir copias del almacén.");
      return;
    }
    const { error: updateError } = await this.client
      .from("player_collection_cards")
      .update({ owned_copies: nextCopies })
      .eq("player_id", playerId)
      .eq("card_id", cardId);
    if (updateError) throw new ValidationError("No se pudo consumir copias del almacén.");
  }
}
