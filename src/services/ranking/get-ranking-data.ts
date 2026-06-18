// src/services/ranking/get-ranking-data.ts - Carga server-side del ranking de jugadores por ELO con forma reciente.
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";

export type MatchResult = "W" | "L" | "D";

export interface IRankingEntry {
  rank: number;
  playerId: string;
  nickname: string;
  avatarUrl: string | null;
  eloRating: number;
  wins: number;
  losses: number;
  /** Últimos 5 resultados del jugador (W=win, L=loss, D=draw), ordenados del más reciente al más antiguo. */
  recentForm: MatchResult[];
}

export interface IRankingData {
  entries: IRankingEntry[];
  localPlayerId: string | null;
  localPlayerRank: number | null;
}

const TOP_PLAYERS_LIMIT = 50;
const FORM_LENGTH = 5;

/**
 * Construye la forma reciente (últimos 5 resultados) de cada jugador a partir
 * de las sesiones de partida finalizadas. Solo incluye jugadores con al menos
 * una partida completada.
 */
function buildRecentForm(
  matches: Array<{ player_a_id: string; player_b_id: string; winner_id: string | null }>,
  playerIds: Set<string>,
): Map<string, MatchResult[]> {
  const formMap = new Map<string, MatchResult[]>();

  // Ordenar por created_at DESC ya viene del query
  for (const match of matches) {
    const { player_a_id, player_b_id, winner_id } = match;

    // Procesar jugador A si está en el ranking
    if (playerIds.has(player_a_id)) {
      const form = formMap.get(player_a_id) ?? [];
      if (form.length < FORM_LENGTH) {
        const result: MatchResult = winner_id === null ? "D" : winner_id === player_a_id ? "W" : "L";
        form.push(result);
        formMap.set(player_a_id, form);
      }
    }

    // Procesar jugador B si está en el ranking
    if (playerIds.has(player_b_id)) {
      const form = formMap.get(player_b_id) ?? [];
      if (form.length < FORM_LENGTH) {
        const result: MatchResult = winner_id === null ? "D" : winner_id === player_b_id ? "W" : "L";
        form.push(result);
        formMap.set(player_b_id, form);
      }
    }

    // Si todos los jugadores del ranking ya tienen 5 resultados, parar
    if (Array.from(formMap.values()).every((f) => f.length >= FORM_LENGTH)) break;
  }

  return formMap;
}

export async function getRankingData(): Promise<IRankingData> {
  const session = await getCurrentUserSession();
  const localPlayerId = session?.user.id ?? null;

  const serviceClient = createSupabaseServiceRoleClient();

  const { data, error } = await serviceClient
    .from("player_profiles")
    .select("player_id, nickname, avatar_url, elo_rating, wins, losses")
    .order("elo_rating", { ascending: false })
    .limit(TOP_PLAYERS_LIMIT);

  if (error || !data) return { entries: [], localPlayerId, localPlayerRank: null };

  const playerIds = new Set(data.map((row) => row.player_id as string));

  // Consulta las sesiones de partida finalizadas donde participa al menos un jugador del ranking.
  // Se limita a 200 para no saturar; con 50 jugadores y 5 resultados cada uno, 200 es suficiente.
  // NOTA: winner_id puede ser NULL (empate), por eso NO se filtra con .not("winner_id", "is", null).
  const { data: matches } = await serviceClient
    .from("match_sessions")
    .select("player_a_id, player_b_id, winner_id")
    .eq("status", "FINISHED")
    .order("created_at", { ascending: false })
    .limit(200);

  const formMap = buildRecentForm(matches ?? [], playerIds);

  const entries: IRankingEntry[] = data.map((row, index) => ({
    rank: index + 1,
    playerId: row.player_id as string,
    nickname: (row.nickname as string) ?? "Duelista",
    avatarUrl: (row.avatar_url as string) ?? null,
    eloRating: (row.elo_rating as number) ?? 1200,
    wins: (row.wins as number) ?? 0,
    losses: (row.losses as number) ?? 0,
    recentForm: formMap.get(row.player_id as string) ?? [],
  }));

  const localPlayerRank = localPlayerId
    ? (entries.find((e) => e.playerId === localPlayerId)?.rank ?? null)
    : null;

  return { entries, localPlayerId, localPlayerRank };
}
