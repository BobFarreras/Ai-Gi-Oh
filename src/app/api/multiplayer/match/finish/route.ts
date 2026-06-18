// src/app/api/multiplayer/match/finish/route.ts - Cierra una sesión de partida multijugador y aplica recompensas Nexus al jugador que llama.
import { NextRequest, NextResponse } from "next/server";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { readJsonObjectBody, readRequiredStringField } from "@/services/security/api/request-body-parser";
import { getAuthenticatedUserId } from "@/services/auth/api/internal/get-authenticated-user-id";
import { createPlayerRouteRepositories } from "@/services/player-persistence/create-player-route-repositories";
import { resolveMatchReward } from "@/core/services/match/rewards/match-reward-policy";
import { ValidationError } from "@/core/errors/ValidationError";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";
import { SupabaseWalletRepository } from "@/infrastructure/persistence/supabase/SupabaseWalletRepository";
import { calculateEloForBothPlayers, calculateEloForDraw } from "@/core/services/match/elo/elo-calculator";

type MatchOutcome = "WIN" | "LOSE" | "DRAW";

function parseOutcome(raw: string): MatchOutcome {
  if (raw === "WIN" || raw === "LOSE" || raw === "DRAW") return raw;
  throw new ValidationError("El resultado de partida multijugador es inválido.");
}

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;

  try {
    const response = NextResponse.json({ ok: true }, { status: 200 });
    const repositories = await createPlayerRouteRepositories(request, response);
    const playerId = await getAuthenticatedUserId(repositories.client);
    const payload = await readJsonObjectBody(request, "Payload inválido para cierre de partida multijugador.");

    const matchId = readRequiredStringField(payload, "matchId", "El matchId es obligatorio.");
    const outcomeRaw = readRequiredStringField(payload, "outcome", "El resultado de partida es obligatorio.");
    const outcome = parseOutcome(outcomeRaw);

    // Verificar que el jugador es participante y la sesión existe
    const { data: matchSession, error: sessionError } = await repositories.client
      .from("match_sessions")
      .select("id, player_a_id, player_b_id, status, winner_id")
      .eq("id", matchId)
      .single<{ id: string; player_a_id: string; player_b_id: string; status: string; winner_id: string | null }>();

    if (sessionError || !matchSession) {
      throw new ValidationError("Sesión de partida no encontrada.");
    }

    if (matchSession.player_a_id !== playerId && matchSession.player_b_id !== playerId) {
      throw new ValidationError("No eres participante de esta partida.");
    }

    // Idempotencia: si ya está cerrada, devolver recompensas sin replicar
    if (matchSession.status === "FINISHED" || matchSession.status === "ABANDONED") {
      const reward = resolveMatchReward({ mode: "MULTIPLAYER", outcome });
      return NextResponse.json({ ok: true, reward, alreadyFinished: true }, { status: 200, headers: response.headers });
    }

    // Determinar el winner_id a persistir
    let winnerId: string | null = null;
    if (outcome === "WIN") winnerId = playerId;
    else if (outcome === "LOSE") {
      winnerId = matchSession.player_a_id === playerId ? matchSession.player_b_id : matchSession.player_a_id;
    }

    // Usar service role para actualizar sin problemas de RLS (solo se ejecuta server-side)
    const serviceClient = createSupabaseServiceRoleClient();
    const { error: updateError } = await serviceClient
      .from("match_sessions")
      .update({ status: "FINISHED", winner_id: winnerId, finished_at: new Date().toISOString() })
      .eq("id", matchId)
      .in("status", ["WAITING", "ACTIVE"]);

    // No lanzar si falla el UPDATE (otro cliente puede haberlo cerrado antes — idempotente)
    if (updateError) {
      const reward = resolveMatchReward({ mode: "MULTIPLAYER", outcome });
      return NextResponse.json({ ok: true, reward, alreadyFinished: true }, { status: 200, headers: response.headers });
    }

    // Limpiar el log de acciones: solo es útil DURANTE la partida (reconexión).
    // Una vez FINISHED, las filas no aportan valor y se purgan para no acumular.
    await serviceClient.from("match_actions").delete().eq("match_id", matchId);

    // Actualizar ELO y estadísticas de ambos jugadores.
    const eloChanges = await updateEloAndStats(serviceClient, matchSession.player_a_id, matchSession.player_b_id, winnerId);

    // Acreditar recompensas al jugador que llama
    const reward = resolveMatchReward({ mode: "MULTIPLAYER", outcome });
    if (reward.nexus > 0) {
      const walletRepo = new SupabaseWalletRepository(repositories.client);
      await walletRepo.creditNexus(playerId, reward.nexus);
    }

    // Devolver el cambio ELO del jugador que llama
    const isPlayerA = matchSession.player_a_id === playerId;
    const eloChange = isPlayerA ? eloChanges.playerA : eloChanges.playerB;

    return NextResponse.json({ ok: true, reward, eloChange }, { status: 200, headers: response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo cerrar la sesión de partida multijugador.");
  }
}

type ServiceClient = ReturnType<typeof createSupabaseServiceRoleClient>;

type EloChange = { old: number; new: number };

async function updateEloAndStats(
  serviceClient: ServiceClient,
  playerAId: string,
  playerBId: string,
  winnerId: string | null,
): Promise<{ playerA: EloChange; playerB: EloChange }> {
  const { data: profiles } = await serviceClient
    .from("player_profiles")
    .select("player_id, elo_rating, wins, losses")
    .in("player_id", [playerAId, playerBId]);

  if (!profiles || profiles.length < 2) {
    return { playerA: { old: 1200, new: 1200 }, playerB: { old: 1200, new: 1200 } };
  }

  const profileA = profiles.find((p) => p.player_id === playerAId);
  const profileB = profiles.find((p) => p.player_id === playerBId);
  if (!profileA || !profileB) {
    return { playerA: { old: 1200, new: 1200 }, playerB: { old: 1200, new: 1200 } };
  }

  const ratingA = (profileA.elo_rating as number) ?? 1200;
  const ratingB = (profileB.elo_rating as number) ?? 1200;

  let newRatingA: number;
  let newRatingB: number;
  let winsA = (profileA.wins as number) ?? 0;
  let lossesA = (profileA.losses as number) ?? 0;
  let winsB = (profileB.wins as number) ?? 0;
  let lossesB = (profileB.losses as number) ?? 0;

  if (winnerId === null) {
    // Empate
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
    serviceClient
      .from("player_profiles")
      .update({ elo_rating: newRatingA, wins: winsA, losses: lossesA })
      .eq("player_id", playerAId),
    serviceClient
      .from("player_profiles")
      .update({ elo_rating: newRatingB, wins: winsB, losses: lossesB })
      .eq("player_id", playerBId),
  ]);

  return {
    playerA: { old: ratingA, new: newRatingA },
    playerB: { old: ratingB, new: newRatingB },
  };
}
