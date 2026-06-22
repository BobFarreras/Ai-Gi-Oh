// src/core/services/match/elo/match-elo-persistence.ts - Calcula, actualiza y persiste el cambio de ELO de ambos jugadores al cerrar una partida multijugador.
import { calculateEloForBothPlayers, calculateEloForDraw } from "@/core/services/match/elo/elo-calculator";

type ServiceClient = ReturnType<typeof import("@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client")["createSupabaseServiceRoleClient"]>;

export type EloChange = { old: number; new: number };

interface IPlayerProfileRow {
  player_id: string;
  elo_rating: number | null;
  wins: number | null;
  losses: number | null;
}

interface IMatchEloChanges {
  playerA: EloChange;
  playerB: EloChange;
}

/**
 * Lee perfiles de ambos jugadores y calcula el nuevo ELO según el ganador.
 * Actualiza player_profiles (elo_rating, wins, losses) y devuelve los cambios.
 */
export async function updateEloAndStats(
  serviceClient: ServiceClient,
  playerAId: string,
  playerBId: string,
  winnerId: string | null,
): Promise<IMatchEloChanges> {
  const { data: profiles } = await serviceClient
    .from("player_profiles")
    .select("player_id, elo_rating, wins, losses")
    .in("player_id", [playerAId, playerBId]);

  const fallback: IMatchEloChanges = { playerA: { old: 1200, new: 1200 }, playerB: { old: 1200, new: 1200 } };
  if (!profiles || profiles.length < 2) return fallback;

  const profileA = (profiles as IPlayerProfileRow[]).find((p) => p.player_id === playerAId);
  const profileB = (profiles as IPlayerProfileRow[]).find((p) => p.player_id === playerBId);
  if (!profileA || !profileB) return fallback;

  const ratingA = profileA.elo_rating ?? 1200;
  const ratingB = profileB.elo_rating ?? 1200;
  let newRatingA: number;
  let newRatingB: number;
  let winsA = profileA.wins ?? 0;
  let lossesA = profileA.losses ?? 0;
  let winsB = profileB.wins ?? 0;
  let lossesB = profileB.losses ?? 0;

  if (winnerId === null) {
    const draw = calculateEloForDraw(ratingA, ratingB);
    newRatingA = draw.playerANewElo;
    newRatingB = draw.playerBNewElo;
  } else if (winnerId === playerAId) {
    const result = calculateEloForBothPlayers(ratingA, ratingB);
    newRatingA = result.winnerNewElo;
    newRatingB = result.loserNewElo;
    winsA += 1;
    lossesB += 1;
  } else {
    const result = calculateEloForBothPlayers(ratingB, ratingA);
    newRatingA = result.loserNewElo;
    newRatingB = result.winnerNewElo;
    winsB += 1;
    lossesA += 1;
  }

  await Promise.all([
    serviceClient.from("player_profiles").update({ elo_rating: newRatingA, wins: winsA, losses: lossesA }).eq("player_id", playerAId),
    serviceClient.from("player_profiles").update({ elo_rating: newRatingB, wins: winsB, losses: lossesB }).eq("player_id", playerBId),
  ]);

  return { playerA: { old: ratingA, new: newRatingA }, playerB: { old: ratingB, new: newRatingB } };
}

/**
 * Persiste el snapshot de ELO en match_sessions para que el path idempotente
 * (el segundo jugador que llama a /finish) pueda leer el delta real.
 */
export async function saveMatchEloSnapshot(
  serviceClient: ServiceClient,
  matchId: string,
  eloChanges: IMatchEloChanges,
): Promise<void> {
  await serviceClient
    .from("match_sessions")
    .update({
      elo_before_a: eloChanges.playerA.old,
      elo_after_a: eloChanges.playerA.new,
      elo_before_b: eloChanges.playerB.old,
      elo_after_b: eloChanges.playerB.new,
    })
    .eq("id", matchId);
}

/**
 * Lee el snapshot de ELO guardado por el primer llamador. Devuelve null si las
 * columnas aún no se han escrito (partida cerrada sin pasar por updateEloAndStats).
 */
export async function readStoredEloChange(
  serviceClient: ServiceClient,
  matchId: string,
  playerId: string,
  playerAId: string,
): Promise<EloChange | null> {
  const { data } = await serviceClient
    .from("match_sessions")
    .select("elo_before_a, elo_after_a, elo_before_b, elo_after_b")
    .eq("id", matchId)
    .single<{ elo_before_a: number | null; elo_after_a: number | null; elo_before_b: number | null; elo_after_b: number | null }>();

  if (!data) return null;
  const isPlayerA = playerId === playerAId;
  const oldElo = isPlayerA ? data.elo_before_a : data.elo_before_b;
  const newElo = isPlayerA ? data.elo_after_a : data.elo_after_b;
  if (oldElo === null || newElo === null) return null;
  return { old: oldElo, new: newElo };
}
