// src/services/ranking/get-weekly-leaderboards.ts - Carga server-side de los rankings semanales (tableros
// ACTIVITY y COMMERCIAL) de la semana en curso: posiciones, tu puesto y los premios configurados.
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";
import { msUntilWeeklyLeaderboardReset } from "@/core/services/progression/reset-schedule";

export type WeeklyLeaderboardBoard = "ACTIVITY" | "COMMERCIAL";

export interface IWeeklyLeaderboardEntry {
  rank: number;
  playerId: string;
  nickname: string;
  avatarUrl: string | null;
  points: number;
  /** Nexus realmente gastados en el mercado esta semana (solo se rellena en el tablero comercial). */
  nexusSpent?: number;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export interface IWeeklyLeaderboardPrize {
  rank: number;
  rewardNexus: number;
}

export interface IWeeklyLeaderboardBoardData {
  board: WeeklyLeaderboardBoard;
  entries: IWeeklyLeaderboardEntry[];
  prizes: IWeeklyLeaderboardPrize[];
  localRank: number | null;
  localPoints: number;
}

export interface IWeeklyLeaderboardsData {
  weekKey: string;
  boards: IWeeklyLeaderboardBoardData[];
  localPlayerId: string | null;
}

const TOP_LIMIT = 50;
const BOARDS: WeeklyLeaderboardBoard[] = ["ACTIVITY", "COMMERCIAL"];

interface IPointRow {
  player_id: string;
  board: string;
  points: number;
}

export async function getWeeklyLeaderboards(): Promise<IWeeklyLeaderboardsData> {
  const session = await getCurrentUserSession();
  const localPlayerId = session?.user.id ?? null;
  const client = createSupabaseServiceRoleClient();

  // La clave de semana la calcula la BD (mismo corte que la acumulación: domingo 22:00 UTC).
  const { data: weekData } = await client.rpc("weekly_leaderboard_week_key", { p_ts: new Date().toISOString() });
  const weekKey = typeof weekData === "string" ? weekData : "";
  if (!weekKey) return { weekKey: "", boards: [], localPlayerId };

  const [{ data: pointRows }, { data: prizeRows }] = await Promise.all([
    client
      .from("weekly_leaderboard_points")
      .select("player_id, board, points")
      .eq("week_key", weekKey)
      .order("points", { ascending: false }),
    client.from("weekly_leaderboard_prizes").select("board, rank, reward_nexus"),
  ]);

  const rows = (pointRows ?? []) as IPointRow[];
  const playerIds = [...new Set(rows.map((row) => row.player_id))];

  const profilesById = new Map<string, { nickname: string; avatarUrl: string | null }>();
  // Nexus gastados en el mercado esta semana (para la columna del ranking comercial). El inicio de la
  // semana = próximo cierre menos 7 días (mismo corte del domingo 22:00 UTC que la acumulación).
  const nexusSpentByPlayer = new Map<string, number>();
  if (playerIds.length > 0) {
    const weekStartIso = new Date(Date.now() + msUntilWeeklyLeaderboardReset(Date.now()) - WEEK_MS).toISOString();
    const [{ data: profiles }, { data: transactions }] = await Promise.all([
      client.from("player_profiles").select("player_id, nickname, avatar_url").in("player_id", playerIds),
      client.from("market_transactions").select("player_id, amount_nexus").in("player_id", playerIds).gte("created_at", weekStartIso),
    ]);
    for (const profile of profiles ?? []) {
      profilesById.set(profile.player_id as string, {
        nickname: (profile.nickname as string) ?? "Duelista",
        avatarUrl: (profile.avatar_url as string) ?? null,
      });
    }
    for (const tx of (transactions ?? []) as Array<{ player_id: string; amount_nexus: number }>) {
      nexusSpentByPlayer.set(tx.player_id, (nexusSpentByPlayer.get(tx.player_id) ?? 0) + (tx.amount_nexus ?? 0));
    }
  }

  const boards: IWeeklyLeaderboardBoardData[] = BOARDS.map((board) => {
    // Ya vienen ordenados por puntos desc; el rank es la posición dentro del tablero.
    const boardRows = rows.filter((row) => row.board === board);
    const entries: IWeeklyLeaderboardEntry[] = boardRows.slice(0, TOP_LIMIT).map((row, index) => ({
      rank: index + 1,
      playerId: row.player_id,
      nickname: profilesById.get(row.player_id)?.nickname ?? "Duelista",
      avatarUrl: profilesById.get(row.player_id)?.avatarUrl ?? null,
      points: row.points,
      // La columna de Nexus gastados solo tiene sentido en el tablero comercial.
      nexusSpent: board === "COMMERCIAL" ? nexusSpentByPlayer.get(row.player_id) ?? 0 : undefined,
    }));
    const localIndex = localPlayerId ? boardRows.findIndex((row) => row.player_id === localPlayerId) : -1;
    const prizes = ((prizeRows ?? []) as Array<{ board: string; rank: number; reward_nexus: number }>)
      .filter((prize) => prize.board === board)
      .map((prize) => ({ rank: prize.rank, rewardNexus: prize.reward_nexus }))
      .sort((a, b) => a.rank - b.rank);
    return {
      board,
      entries,
      prizes,
      localRank: localIndex >= 0 ? localIndex + 1 : null,
      localPoints: localIndex >= 0 ? boardRows[localIndex].points : 0,
    };
  });

  return { weekKey, boards, localPlayerId };
}
