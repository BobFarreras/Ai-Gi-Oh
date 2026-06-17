// src/app/api/multiplayer/match/action/route.ts - Árbitro server-side de turno: valida autoría, orden de acción y retransmite al rival.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-route-client";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";
import { getAuthenticatedUserId } from "@/services/auth/api/internal/get-authenticated-user-id";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { MATCH_ACTION_TYPES } from "@/core/entities/multiplayer/IMatchAction";
import type { IMatchActionPayload } from "@/core/entities/multiplayer/IMatchAction";

interface IActionRequest {
  matchId: string;
  action: IMatchActionPayload;
}

interface IMatchSessionRow {
  player_a_id: string;
  player_b_id: string;
  status: string;
  last_action_player_id: string | null;
}

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;

  try {
    const response = NextResponse.json({ ok: true }, { status: 200 });
    const client = createSupabaseRouteClient(request, response);
    const playerId = await getAuthenticatedUserId(client);

    const body = (await request.json()) as IActionRequest;
    const { matchId, action } = body;

    if (!matchId || !action?.type) {
      return NextResponse.json({ code: "VALIDATION_ERROR", message: "matchId y action son obligatorios." }, { status: 400 });
    }

    if (!MATCH_ACTION_TYPES.includes(action.type)) {
      return NextResponse.json({ code: "VALIDATION_ERROR", message: "Tipo de acción no reconocido." }, { status: 400 });
    }

    // Obtener la sesión de partida
    const { data: session, error: sessionError } = await client
      .from("match_sessions")
      .select("player_a_id,player_b_id,status,last_action_player_id")
      .eq("id", matchId)
      .single<IMatchSessionRow>();

    if (sessionError || !session) {
      return NextResponse.json({ code: "GAME_RULE_ERROR", message: "Partida no encontrada." }, { status: 404 });
    }

    const isParticipant = session.player_a_id === playerId || session.player_b_id === playerId;
    if (!isParticipant) {
      return NextResponse.json({ code: "AUTHORIZATION_ERROR", message: "No eres participante de esta partida." }, { status: 403 });
    }

    if (session.status === "FINISHED" || session.status === "ABANDONED") {
      return NextResponse.json({ code: "GAME_RULE_ERROR", message: "La partida ya ha terminado." }, { status: 400 });
    }

    // Contar acciones para obtener el siguiente sequence
    const { count } = await client
      .from("match_actions")
      .select("id", { count: "exact", head: true })
      .eq("match_id", matchId);

    const nextSequence = (count ?? 0) + 1;

    // Persistir la acción
    const { error: insertError } = await client.from("match_actions").insert({
      match_id: matchId,
      player_id: playerId,
      sequence: nextSequence,
      action_type: action.type,
      payload: action,
    });

    if (insertError) {
      return NextResponse.json({ code: "INTERNAL_ERROR", message: "No se pudo registrar la acción." }, { status: 500 });
    }

    // Activar sesión en el primer movimiento
    if (session.status === "WAITING") {
      await client
        .from("match_sessions")
        .update({ status: "ACTIVE", started_at: new Date().toISOString() })
        .eq("id", matchId);
    }

    // Retransmitir al rival con service role (el canal del cliente no tiene permisos de broadcast desde servidor)
    try {
      const serviceClient = createSupabaseServiceRoleClient();
      await serviceClient.channel(`match:${matchId}`).send({
        type: "broadcast",
        event: "match:action",
        payload: { playerId, action },
      });
    } catch {
      // El broadcast fallido no es crítico: el rival puede recuperar el estado via DB
    }

    return NextResponse.json({ ok: true, sequence: nextSequence }, { status: 200, headers: response.headers });
  } catch (err) {
    return createApiErrorResponse(err, "Error procesando la acción de partida.");
  }
}
