// src/app/api/multiplayer/matchmaking/leave.ts - Sale de la cola de emparejamiento.
import { NextRequest, NextResponse } from "next/server";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
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

    const serviceClient = createSupabaseServiceRoleClient();
    await serviceClient.from("matchmaking_queue").delete().eq("player_id", playerId);

    return NextResponse.json({ ok: true }, { status: 200, headers: response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo salir de la cola de emparejamiento.");
  }
}
