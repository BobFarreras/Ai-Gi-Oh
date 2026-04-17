// src/infrastructure/persistence/supabase/admin/internal/admin-story-deck-save-duel-config.ts - Persistencia de configuración por duelo en Story decks admin.
import { SupabaseClient } from "@supabase/supabase-js";
import { IAdminSaveStoryDuelConfigCommand } from "@/core/entities/admin/IAdminStoryDeckCommands";
import { ValidationError } from "@/core/errors/ValidationError";

function isMissingFusionTableError(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  const message = error.message ?? "";
  return error.code === "PGRST205" || message.includes("story_duel_fusion_cards") && message.includes("schema cache");
}

async function validateDuelBelongsToDeck(client: SupabaseClient, deckListId: string, duelId: string): Promise<void> {
  const { data, error } = await client.from("story_duels").select("id,deck_list_id").eq("id", duelId).maybeSingle<{ id: string; deck_list_id: string }>();
  if (error) throw new ValidationError("No se pudo validar el duelo objetivo.");
  if (!data || data.deck_list_id !== deckListId) throw new ValidationError("El duelo no corresponde al deck seleccionado.");
}

/**
 * Reemplaza de forma transaccional lógica (por lotes) de IA, overrides, fusion y rewards de un duelo.
 */
export async function saveStoryDuelConfig(
  client: SupabaseClient,
  deckListId: string,
  duelConfig: IAdminSaveStoryDuelConfigCommand,
): Promise<void> {
  await validateDuelBelongsToDeck(client, deckListId, duelConfig.duelId);
  const aiUpsert = await client.from("story_duel_ai_profiles").upsert({
    duel_id: duelConfig.duelId,
    difficulty: duelConfig.difficulty,
    ai_profile: duelConfig.aiProfile,
    is_active: true,
  }, { onConflict: "duel_id" });
  if (aiUpsert.error) throw new ValidationError(`No se pudo guardar la dificultad del duelo. (${aiUpsert.error.message})`);

  const deleteOverrides = await client.from("story_duel_deck_overrides").delete().eq("duel_id", duelConfig.duelId);
  if (deleteOverrides.error) throw new ValidationError(`No se pudieron limpiar overrides previos. (${deleteOverrides.error.message})`);
  const deleteFusion = await client.from("story_duel_fusion_cards").delete().eq("duel_id", duelConfig.duelId);
  if (deleteFusion.error) {
    if (isMissingFusionTableError(deleteFusion.error)) throw new ValidationError("Falta la migración de story_duel_fusion_cards en Supabase. Debes crear esa tabla antes de guardar fusiones por duelo.");
    throw new ValidationError(`No se pudieron limpiar cartas de fusión previas. (${deleteFusion.error.message})`);
  }
  const deleteRewards = await client.from("story_duel_reward_cards").delete().eq("duel_id", duelConfig.duelId);
  if (deleteRewards.error) throw new ValidationError(`No se pudieron limpiar recompensas de cartas previas. (${deleteRewards.error.message})`);

  if (duelConfig.fusionCardIds.length > 0) {
    const insertFusion = await client.from("story_duel_fusion_cards").insert(
      duelConfig.fusionCardIds.map((cardId, slotIndex) => ({ duel_id: duelConfig.duelId, slot_index: slotIndex, card_id: cardId, is_active: true })),
    );
    if (insertFusion.error) {
      if (isMissingFusionTableError(insertFusion.error)) throw new ValidationError("Falta la migración de story_duel_fusion_cards en Supabase. Debes crear esa tabla antes de guardar fusiones por duelo.");
      throw new ValidationError(`No se pudieron guardar cartas de fusión del duelo. (${insertFusion.error.message})`);
    }
  }

  if (duelConfig.rewardCardIds.length > 0) {
    const insertRewards = await client.from("story_duel_reward_cards").insert(
      duelConfig.rewardCardIds.map((cardId) => ({ duel_id: duelConfig.duelId, card_id: cardId, copies: 1, drop_rate: 1, is_guaranteed: true })),
    );
    if (insertRewards.error) throw new ValidationError(`No se pudieron guardar recompensas de cartas del duelo. (${insertRewards.error.message})`);
  }

  if (duelConfig.slotOverrides.length === 0) return;
  const insertOverrides = await client.from("story_duel_deck_overrides").insert(
    duelConfig.slotOverrides.map((slot) => ({
      duel_id: duelConfig.duelId,
      slot_index: slot.slotIndex,
      card_id: slot.cardId,
      copies: 1,
      version_tier: slot.versionTier,
      level: slot.level,
      xp: slot.xp,
      attack_override: null,
      defense_override: null,
      effect_override: null,
      is_active: true,
    })),
  );
  if (insertOverrides.error) throw new ValidationError(`No se pudieron guardar overrides de duelo. (${insertOverrides.error.message})`);
}
