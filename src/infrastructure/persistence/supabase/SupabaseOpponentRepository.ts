// src/infrastructure/persistence/supabase/SupabaseOpponentRepository.ts - Carga definición de duelo de historia desde Supabase sin acoplar UI a SQL.
import { SupabaseClient } from "@supabase/supabase-js";
import { IStoryDuelDefinition } from "@/core/entities/opponent/IStoryDuelDefinition";
import { IStoryDuelSummary } from "@/core/entities/opponent/IStoryDuelSummary";
import { ValidationError } from "@/core/errors/ValidationError";
import { IOpponentRepository } from "@/core/repositories/IOpponentRepository";
import { fetchStoryDuelRow } from "@/infrastructure/persistence/supabase/internal/story-opponent-repository-queries";
import {
  IStoryDeckCardRow,
  IStoryDeckOverrideRow,
  IStoryDuelAiProfileRow,
  IStoryDuelFusionCardRow,
  IStoryDuelRow,
  IStoryOpponentRow,
  IStoryRewardCardRow,
  isMissingFusionTableError,
  resolveCanonicalStoryDuelIdentity,
  toDeckEntries,
  toDeckEntriesFromOverrides,
  toRewardCards,
} from "@/infrastructure/persistence/supabase/internal/story-opponent-repository-types";

export class SupabaseOpponentRepository implements IOpponentRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listStoryDuels(): Promise<IStoryDuelSummary[]> {
    const duelResult = await this.client
      .from("story_duels")
      .select("id,chapter,duel_index,title,opponent_id,reward_nexus,reward_player_experience,unlock_requirement_duel_id,is_boss_duel,is_active")
      .eq("is_active", true)
      .order("chapter", { ascending: true })
      .order("duel_index", { ascending: true });
    if (duelResult.error) throw new ValidationError("No se pudo cargar la lista de duelos Story.");
    const duels = (duelResult.data ?? []) as IStoryDuelRow[];
    if (duels.length === 0) return [];

    const opponentIds = Array.from(new Set(duels.map((duel) => duel.opponent_id)));
    const duelIds = duels.map((duel) => duel.id);
    const [opponentsResult, duelAiProfilesResult] = await Promise.all([
      this.client.from("story_opponents").select("id,display_name,avatar_url,difficulty").in("id", opponentIds),
      this.client.from("story_duel_ai_profiles").select("duel_id,difficulty").eq("is_active", true).in("duel_id", duelIds),
    ]);
    if (opponentsResult.error) throw new ValidationError("No se pudo cargar el catálogo de oponentes Story.");
    if (duelAiProfilesResult.error) throw new ValidationError("No se pudo cargar la dificultad por duelo Story.");

    const opponentById = new Map(((opponentsResult.data ?? []) as IStoryOpponentRow[]).map((row) => [row.id, row]));
    const duelDifficultyById = new Map(
      (((duelAiProfilesResult.data ?? []) as Array<Pick<IStoryDuelAiProfileRow, "duel_id" | "difficulty">>)
        .flatMap((row) => (row.duel_id ? [[row.duel_id, row.difficulty] as const] : []))),
    );

    return duels.flatMap((duel) => {
      const opponent = opponentById.get(duel.opponent_id);
      if (!opponent) return [];
      const identity = resolveCanonicalStoryDuelIdentity({ id: duel.id, chapter: duel.chapter, duelIndex: duel.duel_index });
      return [{
        id: duel.id,
        chapter: identity.chapter,
        duelIndex: identity.duelIndex,
        title: duel.title,
        opponentId: opponent.id,
        opponentName: opponent.display_name,
        opponentAvatarUrl: opponent.avatar_url,
        opponentDifficulty: duelDifficultyById.get(duel.id) ?? opponent.difficulty,
        unlockRequirementDuelId: duel.unlock_requirement_duel_id,
        rewardNexus: duel.reward_nexus,
        rewardPlayerExperience: duel.reward_player_experience,
        isBossDuel: duel.is_boss_duel,
        isActive: duel.is_active,
      }];
    });
  }

  async getStoryDuel(chapter: number, duelIndex: number): Promise<IStoryDuelDefinition | null> {
    const duelRow = await fetchStoryDuelRow(this.client, chapter, duelIndex);
    if (!duelRow) return null;

    const opponentResult = await this.client
      .from("story_opponents")
      .select("id,display_name,avatar_url,difficulty")
      .eq("id", duelRow.opponent_id)
      .eq("is_active", true)
      .single<IStoryOpponentRow>();
    if (opponentResult.error || !opponentResult.data) throw new ValidationError("No se pudo cargar el oponente de historia.");

    const [deckResult, overrideResult, aiProfileResult, fusionResult, rewardResult] = await Promise.all([
      this.client.from("story_deck_list_cards").select("slot_index,card_id,copies").eq("deck_list_id", duelRow.deck_list_id).order("slot_index", { ascending: true }),
      this.client.from("story_duel_deck_overrides").select("slot_index,card_id,copies,version_tier,level,xp,attack_override,defense_override,effect_override").eq("duel_id", duelRow.id).eq("is_active", true).order("slot_index", { ascending: true }),
      this.client.from("story_duel_ai_profiles").select("difficulty,ai_profile").eq("duel_id", duelRow.id).eq("is_active", true).maybeSingle<IStoryDuelAiProfileRow>(),
      this.client.from("story_duel_fusion_cards").select("slot_index,card_id").eq("duel_id", duelRow.id).eq("is_active", true).order("slot_index", { ascending: true }),
      this.client.from("story_duel_reward_cards").select("card_id,copies,drop_rate,is_guaranteed").eq("duel_id", duelRow.id).order("card_id", { ascending: true }),
    ]);
    if (deckResult.error) throw new ValidationError("No se pudo cargar el mazo base del oponente de historia.");
    if (overrideResult.error) throw new ValidationError("No se pudieron cargar los overrides del mazo Story.");
    if (aiProfileResult.error) throw new ValidationError("No se pudo cargar el perfil IA del duelo Story.");
    if (fusionResult.error && !isMissingFusionTableError(fusionResult.error)) throw new ValidationError("No se pudo cargar el deck de fusión del duelo Story.");
    if (rewardResult.error) throw new ValidationError("No se pudo cargar la recompensa de cartas del duelo de historia.");

    const overrideRows = (overrideResult.data ?? []) as IStoryDeckOverrideRow[];
    const duelDeckEntries = overrideRows.length > 0 ? toDeckEntriesFromOverrides(overrideRows) : toDeckEntries((deckResult.data ?? []) as IStoryDeckCardRow[]);
    const identity = resolveCanonicalStoryDuelIdentity({ id: duelRow.id, chapter: duelRow.chapter, duelIndex: duelRow.duel_index });

    return {
      id: duelRow.id,
      chapter: identity.chapter,
      duelIndex: identity.duelIndex,
      title: duelRow.title,
      description: duelRow.description,
      opponentId: opponentResult.data.id,
      opponentName: opponentResult.data.display_name,
      opponentAvatarUrl: opponentResult.data.avatar_url,
      opponentDifficulty: aiProfileResult.data?.difficulty ?? opponentResult.data.difficulty,
      opponentAiProfile: aiProfileResult.data?.ai_profile ?? {},
      opponentDeckCardIds: duelDeckEntries.map((entry) => entry.cardId),
      opponentFusionDeckCardIds: isMissingFusionTableError(fusionResult.error) ? [] : ((fusionResult.data ?? []) as IStoryDuelFusionCardRow[]).map((row) => row.card_id),
      opponentDeckEntries: duelDeckEntries,
      openingHandSize: duelRow.opening_hand_size,
      starterPlayer: duelRow.starter_player,
      rewardNexus: duelRow.reward_nexus,
      rewardPlayerExperience: duelRow.reward_player_experience,
      rewardCards: toRewardCards((rewardResult.data ?? []) as IStoryRewardCardRow[]),
      isBossDuel: duelRow.is_boss_duel,
    };
  }
}
