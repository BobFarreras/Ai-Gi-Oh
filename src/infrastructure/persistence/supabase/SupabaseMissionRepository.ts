// src/infrastructure/persistence/supabase/SupabaseMissionRepository.ts - Lee misiones (RPC get_player_missions) y reclama recompensas (RPC claim_mission_reward).
import { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/core/errors/ValidationError";
import { IMissionClaimResult, IMissionView, MissionRewardType, MissionScope } from "@/core/entities/progression/IMission";
import { IMissionRepository } from "@/core/repositories/progression/IMissionRepository";

interface IRawMission {
  missionId: string;
  scope: string;
  objectiveType: string;
  title: string;
  description: string | null;
  targetCount: number;
  rewardNexus: number;
  rewardType: string;
  rewardCurrency: string;
  eventId: string | null;
  periodKey: string;
  progress: number;
  completed: boolean;
  claimed: boolean;
}

function toMissionView(raw: IRawMission): IMissionView {
  return {
    missionId: raw.missionId,
    scope: (raw.scope === "WEEKLY" ? "WEEKLY" : raw.scope === "EVENT" ? "EVENT" : "DAILY") as MissionScope,
    objectiveType: raw.objectiveType,
    title: raw.title,
    description: raw.description,
    targetCount: raw.targetCount,
    rewardNexus: raw.rewardNexus,
    rewardType: (raw.rewardType === "EVENT_POINTS" ? "EVENT_POINTS" : "NEXUS") as MissionRewardType,
    rewardCurrency: raw.rewardCurrency ?? "Nexus",
    eventId: raw.eventId,
    periodKey: raw.periodKey,
    progress: raw.progress,
    completed: raw.completed,
    claimed: raw.claimed,
  };
}

export class SupabaseMissionRepository implements IMissionRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getMissions(): Promise<IMissionView[]> {
    const { data, error } = await this.client.rpc("get_player_missions");
    if (error || !data) return [];
    return (data as IRawMission[]).map(toMissionView);
  }

  async claim(missionId: string, periodKey: string): Promise<IMissionClaimResult> {
    const { data, error } = await this.client.rpc("claim_mission_reward", {
      p_mission_id: missionId,
      p_period_key: periodKey,
    });
    if (error || !data) {
      throw new ValidationError(error?.message ?? "No se pudo reclamar la misión.");
    }
    const result = data as { applied: boolean; alreadyClaimed: boolean; rewardNexus: number };
    return { applied: result.applied, alreadyClaimed: result.alreadyClaimed, rewardNexus: result.rewardNexus };
  }
}
