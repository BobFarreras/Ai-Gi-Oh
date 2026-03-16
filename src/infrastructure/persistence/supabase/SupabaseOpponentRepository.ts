// src/infrastructure/persistence/supabase/SupabaseOpponentRepository.ts - Carga definición de duelo de historia desde Supabase sin acoplar UI a SQL.
import { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/core/errors/ValidationError";
import { IStoryDuelDefinition, IStoryRewardCardDefinition, StoryOpponentDifficulty } from "@/core/entities/opponent/IStoryDuelDefinition";
import { IStoryDuelSummary } from "@/core/entities/opponent/IStoryDuelSummary";
import { IOpponentRepository } from "@/core/repositories/IOpponentRepository";
import { mapStoryDeckCardIds } from "@/infrastructure/persistence/supabase/internal/map-story-deck-card-ids";

interface IStoryDuelRow {
  id: string;
  chapter: number;
  duel_index: number;
  title: string;
  description: string;
  opponent_id: string;
  deck_list_id: string;
  opening_hand_size: number;
  starter_player: "PLAYER" | "OPPONENT" | "RANDOM";
  reward_nexus: number;
  reward_player_experience: number;
  unlock_requirement_duel_id: string | null;
  is_boss_duel: boolean;
  is_active: boolean;
}

interface IStoryOpponentRow {
  id: string;
  display_name: string;
  avatar_url: string | null;
  difficulty: StoryOpponentDifficulty;
}

interface IStoryDeckCardRow {
  card_id: string;
  copies: number;
}

interface IStoryRewardCardRow {
  card_id: string;
  copies: number;
  drop_rate: number;
  is_guaranteed: boolean;
}

function toRewardCards(rows: IStoryRewardCardRow[]): IStoryRewardCardDefinition[] {
  return rows.map((row) => ({
    cardId: row.card_id,
    copies: row.copies,
    dropRate: row.drop_rate,
    isGuaranteed: row.is_guaranteed,
  }));
}

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
    const opponentIds = Array.from(new Set(duels.map((duel) => duel.opponent_id)));
    const opponentsResult = await this.client.from("story_opponents").select("id,display_name,avatar_url,difficulty").in("id", opponentIds);
    if (opponentsResult.error) throw new ValidationError("No se pudo cargar el catálogo de oponentes Story.");
    const opponentRows = (opponentsResult.data ?? []) as IStoryOpponentRow[];
    const opponentById = new Map(opponentRows.map((row) => [row.id, row]));
    return duels.flatMap((duel) => {
      const opponent = opponentById.get(duel.opponent_id);
      if (!opponent) return [];
      return [{
        id: duel.id,
        chapter: duel.chapter,
        duelIndex: duel.duel_index,
        title: duel.title,
        opponentId: opponent.id,
        opponentName: opponent.display_name,
        opponentAvatarUrl: opponent.avatar_url,
        opponentDifficulty: opponent.difficulty,
        unlockRequirementDuelId: duel.unlock_requirement_duel_id,
        rewardNexus: duel.reward_nexus,
        rewardPlayerExperience: duel.reward_player_experience,
        isBossDuel: duel.is_boss_duel,
        isActive: duel.is_active,
      }];
    });
  }

  async getStoryDuel(chapter: number, duelIndex: number): Promise<IStoryDuelDefinition | null> {
    const duelResult = await this.client
      .from("story_duels")
      .select("id,chapter,duel_index,title,description,opponent_id,deck_list_id,opening_hand_size,starter_player,reward_nexus,reward_player_experience,unlock_requirement_duel_id,is_boss_duel,is_active")
      .eq("chapter", chapter)
      .eq("duel_index", duelIndex)
      .eq("is_active", true)
      .maybeSingle<IStoryDuelRow>();
    if (duelResult.error) throw new ValidationError("No se pudo cargar el duelo de historia.");
    if (!duelResult.data) return null;

    const opponentResult = await this.client
      .from("story_opponents")
      .select("id,display_name,avatar_url,difficulty")
      .eq("id", duelResult.data.opponent_id)
      .eq("is_active", true)
      .single<IStoryOpponentRow>();
    if (opponentResult.error || !opponentResult.data) throw new ValidationError("No se pudo cargar el oponente de historia.");

    const deckResult = await this.client
      .from("story_deck_list_cards")
      .select("card_id,copies")
      .eq("deck_list_id", duelResult.data.deck_list_id)
      .order("slot_index", { ascending: true });
    if (deckResult.error) throw new ValidationError("No se pudo cargar el mazo del oponente de historia.");

    const rewardResult = await this.client
      .from("story_duel_reward_cards")
      .select("card_id,copies,drop_rate,is_guaranteed")
      .eq("duel_id", duelResult.data.id)
      .order("card_id", { ascending: true });
    if (rewardResult.error) throw new ValidationError("No se pudo cargar la recompensa de cartas del duelo de historia.");

    return {
      id: duelResult.data.id,
      chapter: duelResult.data.chapter,
      duelIndex: duelResult.data.duel_index,
      title: duelResult.data.title,
      description: duelResult.data.description,
      opponentId: opponentResult.data.id,
      opponentName: opponentResult.data.display_name,
      opponentAvatarUrl: opponentResult.data.avatar_url,
      opponentDifficulty: opponentResult.data.difficulty,
      opponentDeckCardIds: mapStoryDeckCardIds((deckResult.data ?? []) as IStoryDeckCardRow[]),
      openingHandSize: duelResult.data.opening_hand_size,
      starterPlayer: duelResult.data.starter_player,
      rewardNexus: duelResult.data.reward_nexus,
      rewardPlayerExperience: duelResult.data.reward_player_experience,
      rewardCards: toRewardCards((rewardResult.data ?? []) as IStoryRewardCardRow[]),
      isBossDuel: duelResult.data.is_boss_duel,
    };
  }
}
