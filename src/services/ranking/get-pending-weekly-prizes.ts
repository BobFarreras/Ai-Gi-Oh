// src/services/ranking/get-pending-weekly-prizes.ts - Premios de ranking semanal ya cobrados por el jugador
// pero que aún no se le han anunciado (para el diálogo del hub).
//
// El reparto lo hace el cron semanal (migración 094): cierra la semana, archiva las posiciones y acredita los
// Nexus. Aquí SOLO se leen los premios pendientes de avisar; el diálogo informa, nunca otorga.
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { createSupabaseServerClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-server-client";
import { WeeklyLeaderboardBoard } from "@/services/ranking/get-weekly-leaderboards";

export interface IPendingWeeklyPrize {
  /** Id de la fila del historial: es lo que se marca como visto al cerrar el diálogo. */
  id: number;
  weekKey: string;
  board: WeeklyLeaderboardBoard;
  finalRank: number;
  points: number;
  awardedNexus: number;
}

interface IWeeklyPrizeRow {
  id: number;
  week_key: string;
  board: string;
  final_rank: number;
  points: number;
  awarded_nexus: number;
}

/**
 * Premios con Nexus (`awarded_nexus > 0`) del jugador de la sesión que aún no se le han enseñado.
 * Puede devolver más de uno: se puede premiar en los dos tableros (Actividad y Comercio) la misma semana.
 */
export async function getPendingWeeklyPrizes(): Promise<IPendingWeeklyPrize[]> {
  const session = await getCurrentUserSession();
  if (!session?.user.id) return [];

  const client = await createSupabaseServerClient();
  const { data, error } = await client
    .from("weekly_leaderboard_history")
    .select("id, week_key, board, final_rank, points, awarded_nexus")
    .eq("player_id", session.user.id)
    .is("seen_at", null)
    .gt("awarded_nexus", 0)
    .order("awarded_nexus", { ascending: false });

  // Un fallo aquí no puede tumbar el hub: sin aviso, el jugador conserva igualmente sus Nexus (ya acreditados).
  if (error || !data) return [];

  return (data as IWeeklyPrizeRow[]).map((row) => ({
    id: row.id,
    weekKey: row.week_key,
    board: row.board === "COMMERCIAL" ? "COMMERCIAL" : "ACTIVITY",
    finalRank: row.final_rank,
    points: row.points,
    awardedNexus: row.awarded_nexus,
  }));
}
