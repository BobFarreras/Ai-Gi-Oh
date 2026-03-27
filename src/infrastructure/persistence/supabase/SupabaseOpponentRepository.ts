// src/infrastructure/persistence/supabase/SupabaseOpponentRepository.ts - Carga definición de duelo de historia desde Supabase sin acoplar UI a SQL.
import { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/core/errors/ValidationError";
import {
  IStoryDeckEntryDefinition,
  IStoryDuelDefinition,
  IStoryRewardCardDefinition,
  StoryOpponentDifficulty,
} from "@/core/entities/opponent/IStoryDuelDefinition";
import { IStoryDuelSummary } from "@/core/entities/opponent/IStoryDuelSummary";
import { IOpponentRepository } from "@/core/repositories/IOpponentRepository";

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
  slot_index: number;
}

interface IStoryRewardCardRow {
  card_id: string;
  copies: number;
  drop_rate: number;
  is_guaranteed: boolean;
}

interface IStoryDuelAiProfileRow {
  difficulty: StoryOpponentDifficulty;
  ai_profile: Record<string, unknown> | null;
}

interface IStoryDeckOverrideRow {
  slot_index: number;
  card_id: string;
  copies: number;
  version_tier: number;
  level: number;
  xp: number;
  attack_override: number | null;
  defense_override: number | null;
  effect_override: Record<string, unknown> | null;
}

function toRewardCards(rows: IStoryRewardCardRow[]): IStoryRewardCardDefinition[] {
  return rows.map((row) => ({
    cardId: row.card_id,
    copies: row.copies,
    dropRate: row.drop_rate,
    isGuaranteed: row.is_guaranteed,
  }));
}

function toDeckEntries(rows: IStoryDeckCardRow[]): IStoryDeckEntryDefinition[] {
  return rows.flatMap((row) =>
    Array.from({ length: row.copies }, () => ({
      cardId: row.card_id,
      versionTier: 0,
      level: 0,
      xp: 0,
      attackOverride: null,
      defenseOverride: null,
      effectOverride: null,
    })),
  );
}

function toDeckEntriesFromOverrides(rows: IStoryDeckOverrideRow[]): IStoryDeckEntryDefinition[] {
  return rows.flatMap((row) =>
    Array.from({ length: row.copies }, () => ({
      cardId: row.card_id,
      versionTier: row.version_tier,
      level: row.level,
      xp: row.xp,
      attackOverride: row.attack_override,
      defenseOverride: row.defense_override,
      effectOverride: row.effect_override ?? null,
    })),
  );
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

    const [deckResult, overrideResult, aiProfileResult] = await Promise.all([
      this.client
      .from("story_deck_list_cards")
      .select("slot_index,card_id,copies")
      .eq("deck_list_id", duelResult.data.deck_list_id)
      .order("slot_index", { ascending: true }),
      this.client
        .from("story_duel_deck_overrides")
        .select("slot_index,card_id,copies,version_tier,level,xp,attack_override,defense_override,effect_override")
        .eq("duel_id", duelResult.data.id)
        .eq("is_active", true)
        .order("slot_index", { ascending: true }),
      this.client
        .from("story_duel_ai_profiles")
        .select("difficulty,ai_profile")
        .eq("duel_id", duelResult.data.id)
        .eq("is_active", true)
        .maybeSingle<IStoryDuelAiProfileRow>(),
    ]);
    if (deckResult.error) throw new ValidationError("No se pudo cargar el mazo base del oponente de historia.");
    if (overrideResult.error) throw new ValidationError("No se pudieron cargar los overrides del mazo Story.");
    if (aiProfileResult.error) throw new ValidationError("No se pudo cargar el perfil IA del duelo Story.");

    const rewardResult = await this.client
      .from("story_duel_reward_cards")
      .select("card_id,copies,drop_rate,is_guaranteed")
      .eq("duel_id", duelResult.data.id)
      .order("card_id", { ascending: true });
    if (rewardResult.error) throw new ValidationError("No se pudo cargar la recompensa de cartas del duelo de historia.");

    const baseRows = (deckResult.data ?? []) as IStoryDeckCardRow[];
    const overrideRows = (overrideResult.data ?? []) as IStoryDeckOverrideRow[];
    const duelDeckEntries = overrideRows.length > 0 ? toDeckEntriesFromOverrides(overrideRows) : toDeckEntries(baseRows);
    const opponentDifficulty = aiProfileResult.data?.difficulty ?? opponentResult.data.difficulty;
    const opponentAiProfile = aiProfileResult.data?.ai_profile ?? {};
    return {
      id: duelResult.data.id,
      chapter: duelResult.data.chapter,
      duelIndex: duelResult.data.duel_index,
      title: duelResult.data.title,
      description: duelResult.data.description,
      opponentId: opponentResult.data.id,
      opponentName: opponentResult.data.display_name,
      opponentAvatarUrl: opponentResult.data.avatar_url,
      opponentDifficulty,
      opponentAiProfile,
      opponentDeckCardIds: duelDeckEntries.map((entry) => entry.cardId),
      opponentDeckEntries: duelDeckEntries,
      openingHandSize: duelResult.data.opening_hand_size,
      starterPlayer: duelResult.data.starter_player,
      rewardNexus: duelResult.data.reward_nexus,
      rewardPlayerExperience: duelResult.data.reward_player_experience,
      rewardCards: toRewardCards((rewardResult.data ?? []) as IStoryRewardCardRow[]),
      isBossDuel: duelResult.data.is_boss_duel,
    };
  }
}
