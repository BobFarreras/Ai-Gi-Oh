// src/infrastructure/persistence/supabase/SupabaseTutorialRewardClaimRepository.ts - Repositorio Supabase para claim único de recompensa final tutorial.
import { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/core/errors/ValidationError";
import { ITutorialRewardClaimRepository, ITutorialRewardClaimResult } from "@/core/repositories/ITutorialRewardClaimRepository";

interface ITutorialRewardClaimRow {
  player_id: string;
  reward_kind: "NEXUS";
  reward_nexus: number;
  claimed_at: string;
}

interface IPostgrestErrorShape {
  code?: string;
}

function toEntity(row: ITutorialRewardClaimRow): ITutorialRewardClaimResult {
  return { claimedAtIso: row.claimed_at, rewardKind: row.reward_kind, rewardNexus: row.reward_nexus };
}

export class SupabaseTutorialRewardClaimRepository implements ITutorialRewardClaimRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getClaimByPlayerId(playerId: string): Promise<ITutorialRewardClaimResult | null> {
    const { data, error } = await this.client
      .from("player_tutorial_reward_claims")
      .select("player_id,reward_kind,reward_nexus,claimed_at")
      .eq("player_id", playerId)
      .maybeSingle<ITutorialRewardClaimRow>();
    if (error) throw new ValidationError("No se pudo leer el claim de recompensa tutorial.");
    return data ? toEntity(data) : null;
  }

  async tryClaimNexusReward(playerId: string, rewardNexus: number): Promise<boolean> {
    const { error } = await this.client.from("player_tutorial_reward_claims").insert({
      player_id: playerId,
      reward_kind: "NEXUS",
      reward_nexus: rewardNexus,
    });
    if (!error) return true;
    if ((error as IPostgrestErrorShape).code === "23505") return false;
    throw new ValidationError("No se pudo reservar el claim de recompensa tutorial.");
  }
}
