// src/app/api/multiplayer/match/finish/route.ts - Cierra una sesión de partida multijugador y aplica recompensas Nexus y ELO al jugador que llama.
import { NextRequest, NextResponse } from "next/server";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { readJsonObjectBody, readRequiredStringField } from "@/services/security/api/request-body-parser";
import { getAuthenticatedUserId } from "@/services/auth/api/internal/get-authenticated-user-id";
import { createPlayerRouteRepositories } from "@/services/player-persistence/create-player-route-repositories";
import { recordProgressionEvent } from "@/services/progression/record-progression-event";
import { resolveDuelProgressionActions } from "@/core/services/progression/resolve-progression-actions";
import { resolveMatchReward } from "@/core/services/match/rewards/match-reward-policy";
import { ValidationError } from "@/core/errors/ValidationError";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";
import { SupabaseWalletRepository } from "@/infrastructure/persistence/supabase/SupabaseWalletRepository";
import {
  updateEloAndStats,
  saveMatchEloSnapshot,
  readStoredEloChange,
  type EloChange,
} from "@/core/services/match/elo/match-elo-persistence";

type MatchOutcome = "WIN" | "LOSE" | "DRAW";

function parseOutcome(raw: string): MatchOutcome {
  if (raw === "WIN" || raw === "LOSE" || raw === "DRAW") return raw;
  throw new ValidationError("El resultado de partida multijugador es inválido.");
}

/**
 * Resuelve el ELO change para el path idempotente: primero intenta leer el
 * snapshot guardado por el primer llamador (delta real); si no existe (partida
 * cerrada sin snapshot), lee el ELO actual como fallback (delta 0).
 */
async function resolveIdempotentEloChange(
  serviceClient: ReturnType<typeof createSupabaseServiceRoleClient>,
  matchId: string,
  playerId: string,
  playerAId: string,
): Promise<EloChange> {
  const stored = await readStoredEloChange(serviceClient, matchId, playerId, playerAId);
  if (stored) return stored;
  // Fallback: partida cerrada sin snapshot (ej. migración 052 no aplicada).
  const { data: profile } = await serviceClient
    .from("player_profiles")
    .select("elo_rating")
    .eq("player_id", playerId)
    .single();
  const current = (profile?.elo_rating as number) ?? 1200;
  return { old: current, new: current };
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

    const { data: matchSession, error: sessionError } = await repositories.client
      .from("match_sessions")
      .select("id, player_a_id, player_b_id, status, winner_id")
      .eq("id", matchId)
      .single<{ id: string; player_a_id: string; player_b_id: string; status: string; winner_id: string | null }>();

    if (sessionError || !matchSession) throw new ValidationError("Sesión de partida no encontrada.");
    if (matchSession.player_a_id !== playerId && matchSession.player_b_id !== playerId) {
      throw new ValidationError("No eres participante de esta partida.");
    }

    const serviceClient = createSupabaseServiceRoleClient();

    // Path idempotente: la partida ya está cerrada por el otro jugador.
    if (matchSession.status === "FINISHED" || matchSession.status === "ABANDONED") {
      const reward = resolveMatchReward({ mode: "MULTIPLAYER", outcome });
      const eloChange = await resolveIdempotentEloChange(serviceClient, matchId, playerId, matchSession.player_a_id);
      return NextResponse.json({ ok: true, reward, eloChange, alreadyFinished: true }, { status: 200, headers: response.headers });
    }

    // Path normal: cerrar la partida y calcular ELO de ambos jugadores.
    let winnerId: string | null = null;
    if (outcome === "WIN") winnerId = playerId;
    else if (outcome === "LOSE") winnerId = matchSession.player_a_id === playerId ? matchSession.player_b_id : matchSession.player_a_id;

    const { error: updateError } = await serviceClient
      .from("match_sessions")
      .update({ status: "FINISHED", winner_id: winnerId, finished_at: new Date().toISOString() })
      .eq("id", matchId)
      .in("status", ["WAITING", "ACTIVE"]);

    if (updateError) {
      const reward = resolveMatchReward({ mode: "MULTIPLAYER", outcome });
      const eloChange = await resolveIdempotentEloChange(serviceClient, matchId, playerId, matchSession.player_a_id);
      return NextResponse.json({ ok: true, reward, eloChange, alreadyFinished: true }, { status: 200, headers: response.headers });
    }

    // Limpiar acciones y calcular ELO + persistir snapshot para el path idempotente.
    await serviceClient.from("match_actions").delete().eq("match_id", matchId);
    const eloChanges = await updateEloAndStats(serviceClient, matchSession.player_a_id, matchSession.player_b_id, winnerId);
    await saveMatchEloSnapshot(serviceClient, matchId, eloChanges);

    // Acreditar recompensas al jugador que llama.
    const reward = resolveMatchReward({ mode: "MULTIPLAYER", outcome });
    if (reward.nexus > 0) {
      await new SupabaseWalletRepository(repositories.client).creditNexus(playerId, reward.nexus);
    }

    // Progresión de misiones (solo en el cierre real, no en el path idempotente, para no inflar).
    // El ganador se deriva del winnerId server-side, no del outcome del cliente.
    await recordProgressionEvent(repositories.client, resolveDuelProgressionActions("MULTIPLAYER", winnerId === playerId));

    const isPlayerA = matchSession.player_a_id === playerId;
    const eloChange = isPlayerA ? eloChanges.playerA : eloChanges.playerB;
    return NextResponse.json({ ok: true, reward, eloChange }, { status: 200, headers: response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo cerrar la sesión de partida multijugador.");
  }
}
