// src/infrastructure/persistence/supabase/SupabaseDeckRepository.ts - Repositorio de deck persistido por slots y acceso a colección integrada.
import { SupabaseClient } from "@supabase/supabase-js";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IDeck, IDeckSwapResult } from "@/core/entities/home/IDeck";
import { ValidationError } from "@/core/errors/ValidationError";
import { ICardCollectionRepository } from "@/core/repositories/ICardCollectionRepository";
import { IDeckRepository, ISwapActiveDeckCommand } from "@/core/repositories/IDeckRepository";
import { createPrivilegedWriteClientResolver } from "@/infrastructure/persistence/supabase/internal/resolve-privileged-write-client";

interface IDeckSlotRow {
  player_id: string;
  slot_index: number;
  card_id: string | null;
}

interface IFusionDeckSlotRow {
  player_id: string;
  slot_index: number;
  card_id: string | null;
}

function isMissingFusionDeckTable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? (error as { code?: unknown }).code : null;
  return code === "42P01";
}

function createDefaultDeckSlots(playerId: string): IDeckSlotRow[] {
  return Array.from({ length: 20 }, (_, index) => ({ player_id: playerId, slot_index: index, card_id: null }));
}

function createDefaultFusionDeckSlots(playerId: string): IFusionDeckSlotRow[] {
  return Array.from({ length: 2 }, (_, index) => ({ player_id: playerId, slot_index: index, card_id: null }));
}

function resolveMissingDeckCopies(deck: IDeck, collection: ICollectionCard[]): string[] {
  const requiredByCardId = new Map<string, number>();
  for (const slot of deck.slots) {
    if (!slot.cardId) continue;
    requiredByCardId.set(slot.cardId, (requiredByCardId.get(slot.cardId) ?? 0) + 1);
  }
  const availableByCardId = new Map(collection.map((entry) => [entry.card.id, entry.ownedCopies]));
  const missingCardIds: string[] = [];
  for (const [cardId, requiredCopies] of requiredByCardId.entries()) {
    const availableCopies = availableByCardId.get(cardId) ?? 0;
    if (availableCopies >= requiredCopies) continue;
    missingCardIds.push(...Array.from({ length: requiredCopies - availableCopies }, () => cardId));
  }
  return missingCardIds;
}

export class SupabaseDeckRepository implements IDeckRepository {
  private readonly writeClient: () => SupabaseClient;

  constructor(
    private readonly client: SupabaseClient,
    private readonly collectionRepository: ICardCollectionRepository,
  ) {
    this.writeClient = createPrivilegedWriteClientResolver();
  }

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
    const { data: fusionData, error: fusionError } = await this.client
      .from("player_fusion_deck_slots")
      .select("player_id,slot_index,card_id")
      .eq("player_id", playerId)
      .order("slot_index", { ascending: true });
    if (fusionError && !isMissingFusionDeckTable(fusionError)) {
      throw new ValidationError("No se pudo cargar el bloque de fusión del jugador.");
    }
    if (fusionError && isMissingFusionDeckTable(fusionError)) {
      const slots = rows.map((row) => ({ index: row.slot_index, cardId: row.card_id }));
      return { playerId, slots, fusionSlots: createDefaultFusionDeckSlots(playerId).map((row) => ({ index: row.slot_index, cardId: row.card_id })) };
    }
    let fusionRows = fusionData as IFusionDeckSlotRow[];
    if (fusionRows.length === 0) {
      const { error: insertFusionError } = await this.client.from("player_fusion_deck_slots").insert(createDefaultFusionDeckSlots(playerId));
      if (insertFusionError) throw new ValidationError("No se pudo inicializar el bloque de fusión del jugador.");
      const { data: insertedFusionRows, error: readFusionError } = await this.client
        .from("player_fusion_deck_slots")
        .select("player_id,slot_index,card_id")
        .eq("player_id", playerId)
        .order("slot_index", { ascending: true });
      if (readFusionError) throw new ValidationError("No se pudo cargar el bloque de fusión inicializado del jugador.");
      fusionRows = insertedFusionRows as IFusionDeckSlotRow[];
    }
    const slots = rows.map((row) => ({ index: row.slot_index, cardId: row.card_id }));
    const fusionSlots = fusionRows.map((row) => ({ index: row.slot_index, cardId: row.card_id }));
    return { playerId, slots, fusionSlots };
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
    for (const slot of deck.fusionSlots) {
      const { error } = await this.client
        .from("player_fusion_deck_slots")
        .update({ card_id: slot.cardId })
        .eq("player_id", deck.playerId)
        .eq("slot_index", slot.index);
      if (error && !isMissingFusionDeckTable(error)) throw new ValidationError("No se pudo guardar el bloque de fusión del jugador.");
    }
  }

  async getBankDeck(playerId: string): Promise<IDeck> {
    const [{ data: mainData, error: mainError }, { data: fusionData, error: fusionError }] = await Promise.all([
      this.client.from("player_deck_bank").select("slot_index,card_id").eq("player_id", playerId).order("slot_index", { ascending: true }),
      this.client.from("player_deck_bank_fusion").select("slot_index,card_id").eq("player_id", playerId).order("slot_index", { ascending: true }),
    ]);
    if (mainError || fusionError) throw new ValidationError("No se pudo cargar el segundo mazo del jugador.");
    const mainRows = (mainData ?? []) as IDeckSlotRow[];
    const fusionRows = (fusionData ?? []) as IFusionDeckSlotRow[];
    // Bootstrap: si el banco nunca se inicializó, se siembra como copia del mazo activo (no vacío).
    if (mainRows.length === 0) {
      const active = await this.getDeck(playerId);
      const bankMain = active.slots.map((slot) => ({ player_id: playerId, slot_index: slot.index, card_id: slot.cardId }));
      const bankFusion = active.fusionSlots.map((slot) => ({ player_id: playerId, slot_index: slot.index, card_id: slot.cardId }));
      const [{ error: insMainError }, { error: insFusionError }] = await Promise.all([
        this.client.from("player_deck_bank").insert(bankMain),
        this.client.from("player_deck_bank_fusion").insert(bankFusion),
      ]);
      if (insMainError || insFusionError) throw new ValidationError("No se pudo inicializar el segundo mazo del jugador.");
      return { playerId, slots: active.slots.map((s) => ({ index: s.index, cardId: s.cardId })), fusionSlots: active.fusionSlots.map((s) => ({ index: s.index, cardId: s.cardId })) };
    }
    return {
      playerId,
      slots: mainRows.map((row) => ({ index: row.slot_index, cardId: row.card_id })),
      fusionSlots: fusionRows.map((row) => ({ index: row.slot_index, cardId: row.card_id })),
    };
  }

  async swapActiveDeck(command: ISwapActiveDeckCommand): Promise<IDeckSwapResult> {
    const { data, error } = await this.writeClient().rpc("swap_active_deck", {
      p_player_id: command.playerId,
      p_operation_id: command.operationId,
    });
    if (error) throw new ValidationError("No se pudo cambiar el mazo activo.");
    const payload = (data ?? {}) as Record<string, unknown>;
    return {
      ok: payload.ok === true,
      reason: payload.reason as IDeckSwapResult["reason"],
      duplicate: payload.duplicate === true,
    };
  }

  async getCollection(playerId: string): Promise<ICollectionCard[]> {
    const [collection, deck] = await Promise.all([
      this.collectionRepository.getCollection(playerId),
      this.getDeck(playerId),
    ]);
    const missingCardIds = resolveMissingDeckCopies(deck, collection);
    if (missingCardIds.length === 0) return collection;
    await this.collectionRepository.addCards(playerId, missingCardIds);
    return this.collectionRepository.getCollection(playerId);
  }
}
