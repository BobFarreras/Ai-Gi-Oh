// src/infrastructure/persistence/supabase/SupabaseTutorialRewardClaimRepository.ts - Repositorio Supabase para claim único de recompensa final tutorial.
import { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/core/errors/ValidationError";
import { ITutorialRewardClaimRepository, ITutorialRewardClaimResult } from "@/core/repositories/ITutorialRewardClaimRepository";
import { SupabaseWalletRepository } from "@/infrastructure/persistence/supabase/SupabaseWalletRepository";

interface ITutorialRewardClaimRow {
  player_id: string;
  reward_kind: "NEXUS";
  reward_nexus: number;
  claimed_at: string;
}

interface IPostgrestErrorShape {
  code?: string;
  message?: string;
}

interface ITutorialAtomicClaimRow {
  applied: boolean;
}

function isMissingRpcFunction(error: IPostgrestErrorShape | null): boolean {
  const normalizedMessage = error?.message?.toLowerCase() ?? "";
  return error?.code === "42883" || normalizedMessage.includes("function") || normalizedMessage.includes("rpc");
}

function isTutorialAtomicBusinessRuleError(error: IPostgrestErrorShape | null): boolean {
  return error?.code === "22023";
}

function resolveAtomicAppliedFlag(data: unknown): boolean | null {
  if (typeof data === "boolean") return data;
  if (Array.isArray(data)) {
    const row = data[0] as ITutorialAtomicClaimRow | undefined;
    return row && typeof row.applied === "boolean" ? row.applied : null;
  }
  if (data && typeof data === "object") {
    const row = data as Partial<ITutorialAtomicClaimRow>;
    return typeof row.applied === "boolean" ? row.applied : null;
  }
  return null;
}

function toEntity(row: ITutorialRewardClaimRow): ITutorialRewardClaimResult {
  return { claimedAtIso: row.claimed_at, rewardKind: row.reward_kind, rewardNexus: row.reward_nexus };
}

export class SupabaseTutorialRewardClaimRepository implements ITutorialRewardClaimRepository {
  private readonly walletRepository: SupabaseWalletRepository;

  constructor(private readonly client: SupabaseClient) {
    this.walletRepository = new SupabaseWalletRepository(client);
  }

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

  async tryClaimAndApplyNexusReward(playerId: string, rewardNexus: number): Promise<boolean> {
    const rpcResult = await this.client.rpc("tutorial_claim_final_reward_nexus", {
      p_player_id: playerId,
      p_reward_nexus: rewardNexus,
    });
    if (!rpcResult.error) {
      const applied = resolveAtomicAppliedFlag(rpcResult.data);
      if (applied !== null) return applied;
    }
    if (rpcResult.error && isTutorialAtomicBusinessRuleError(rpcResult.error as IPostgrestErrorShape)) {
      throw new ValidationError("No se pudo aplicar la recompensa final del tutorial.");
    }
    if (rpcResult.error && !isMissingRpcFunction(rpcResult.error as IPostgrestErrorShape)) {
      // Fallback para entornos con RPC desplegada pero con fallos de contexto/permisos.
    }

    // Fallback temporal para entornos sin la función atómica desplegada.
    const claimed = await this.tryClaimNexusReward(playerId, rewardNexus);
    if (!claimed) return false;
    await this.walletRepository.creditNexus(playerId, rewardNexus);
    return true;
  }
}
