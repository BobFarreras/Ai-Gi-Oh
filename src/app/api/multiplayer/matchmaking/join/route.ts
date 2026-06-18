// src/app/api/multiplayer/matchmaking/join.ts - Entra en la cola de emparejamiento; si hay rival, crea la sesión y devuelve matchId.
import { NextRequest, NextResponse } from "next/server";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { readJsonObjectBody } from "@/services/security/api/request-body-parser";
import { getAuthenticatedUserId } from "@/services/auth/api/internal/get-authenticated-user-id";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";
import { createPlayerRouteRepositories } from "@/services/player-persistence/create-player-route-repositories";

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;

  try {
    const response = NextResponse.json({ ok: true }, { status: 200 });
    const repositories = await createPlayerRouteRepositories(request, response);
    const playerId = await getAuthenticatedUserId(repositories.client);
    const payload = await readJsonObjectBody(request, "Payload inválido.");
    const deckIds = Array.isArray(payload.deckIds) ? (payload.deckIds as string[]) : [];

    const serviceClient = createSupabaseServiceRoleClient();
    const { data, error } = await serviceClient.rpc("find_or_create_match", {
      p_player_id: playerId,
      p_deck_ids: deckIds,
    });

    if (error) throw new Error(error.message);

    const result = data as { matched: boolean; match_id?: string };

    return NextResponse.json(
      { ok: true, matched: result.matched, matchId: result.match_id ?? null },
      { status: 200, headers: response.headers },
    );
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo procesar la cola de emparejamiento.");
  }
}
