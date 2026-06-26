// src/infrastructure/persistence/supabase/SupabaseLoginStreakRepository.ts - Lee la racha de login (RLS fila propia) y reclama vía RPC atómica claim_daily_login.
import { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/core/errors/ValidationError";
import { IDailyLoginClaimResult, ILoginRewardDay, ILoginStreakStatus, LoginRewardType } from "@/core/entities/progression/ILoginStreak";
import { ILoginStreakRepository } from "@/core/repositories/progression/ILoginStreakRepository";
import { resolveLoginStreakView } from "@/core/services/progression/login-streak-status";

interface ICalendarRow {
  day_index: number;
  reward_type: string;
  reward_nexus: number;
  reward_card_id: string | null;
  label: string | null;
}

interface IStreakRow {
  current_streak: number;
  longest_streak: number;
  last_claim_date: string | null;
}

interface IClaimRpcResult {
  applied: boolean;
  alreadyClaimed: boolean;
  currentStreak: number;
  dayIndex: number;
  rewardType: LoginRewardType;
  rewardNexus: number;
  rewardCardId: string | null;
}

function toRewardDay(row: ICalendarRow): ILoginRewardDay {
  return {
    dayIndex: row.day_index,
    rewardType: row.reward_type === "CARD" ? "CARD" : "NEXUS",
    rewardNexus: row.reward_nexus,
    rewardCardId: row.reward_card_id,
    label: row.label,
  };
}

export class SupabaseLoginStreakRepository implements ILoginStreakRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getStatus(): Promise<ILoginStreakStatus> {
    const [calendarResult, streakResult] = await Promise.all([
      this.client.from("login_reward_calendar").select("day_index, reward_type, reward_nexus, reward_card_id, label").order("day_index", { ascending: true }),
      this.client.from("player_login_streaks").select("current_streak, longest_streak, last_claim_date").maybeSingle<IStreakRow>(),
    ]);

    const calendar = (calendarResult.data as ICalendarRow[] | null ?? []).map(toRewardDay);
    const streak = streakResult.data ?? { current_streak: 0, longest_streak: 0, last_claim_date: null };
    const today = new Date().toISOString().slice(0, 10);
    const view = resolveLoginStreakView(
      { currentStreak: streak.current_streak, longestStreak: streak.longest_streak, lastClaimDate: streak.last_claim_date },
      today,
    );

    return {
      currentStreak: streak.current_streak,
      longestStreak: streak.longest_streak,
      claimedToday: view.claimedToday,
      pendingDayIndex: view.pendingDayIndex,
      calendar,
    };
  }

  async claim(): Promise<IDailyLoginClaimResult> {
    const { data, error } = await this.client.rpc("claim_daily_login");
    if (error || !data) {
      throw new ValidationError(error?.message ?? "No se pudo reclamar el login diario.");
    }
    const result = data as IClaimRpcResult;
    return {
      applied: result.applied,
      alreadyClaimed: result.alreadyClaimed,
      currentStreak: result.currentStreak,
      dayIndex: result.dayIndex,
      rewardType: result.rewardType === "CARD" ? "CARD" : "NEXUS",
      rewardNexus: result.rewardNexus,
      rewardCardId: result.rewardCardId,
    };
  }
}
