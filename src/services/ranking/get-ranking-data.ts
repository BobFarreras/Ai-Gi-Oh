// src/services/ranking/get-ranking-data.ts - Carga server-side del ranking de jugadores por ELO.
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { createSupabaseBrowserClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-browser-client";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";

export interface IRankingEntry {
  rank: number;
  playerId: string;
  nickname: string;
  avatarUrl: string | null;
  eloRating: number;
  wins: number;
  losses: number;
}

export interface IRankingData {
  entries: IRankingEntry[];
  localPlayerId: string | null;
  localPlayerRank: number | null;
}

const TOP_PLAYERS_LIMIT = 50;

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

  const entries: IRankingEntry[] = data.map((row, index) => ({
    rank: index + 1,
    playerId: row.player_id as string,
    nickname: (row.nickname as string) ?? "Duelista",
    avatarUrl: (row.avatar_url as string) ?? null,
    eloRating: (row.elo_rating as number) ?? 1200,
    wins: (row.wins as number) ?? 0,
    losses: (row.losses as number) ?? 0,
  }));

  const localPlayerRank = localPlayerId
    ? (entries.find((e) => e.playerId === localPlayerId)?.rank ?? null)
    : null;

  return { entries, localPlayerId, localPlayerRank };
}
