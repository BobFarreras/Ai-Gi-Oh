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

    // Acreditar recompensas al jugador que llama
    const reward = resolveMatchReward({ mode: "MULTIPLAYER", outcome });
    if (reward.nexus > 0) {
      const walletRepo = new SupabaseWalletRepository(repositories.client);
      await walletRepo.creditNexus(playerId, reward.nexus);
    }

    return NextResponse.json({ ok: true, reward }, { status: 200, headers: response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo cerrar la sesión de partida multijugador.");
  }
}
