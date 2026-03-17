// src/app/api/training/tutorial/complete/route.ts - Endpoint para confirmar finalización del tutorial de combate.
import { NextRequest, NextResponse } from "next/server";
import { SupabasePlayerProgressRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerProgressRepository";
import { getAuthenticatedUserId } from "@/services/auth/api/internal/get-authenticated-user-id";
import { createPlayerRouteRepositories } from "@/services/player-persistence/create-player-route-repositories";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { processTrainingTutorialCompletion } from "./internal/process-training-tutorial-completion";

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const response = NextResponse.json({ ok: true }, { status: 200 });
    const repositories = await createPlayerRouteRepositories(request, response);
    const playerId = await getAuthenticatedUserId(repositories.client);
    const result = await processTrainingTutorialCompletion({
      playerId,
      playerProgressRepository: new SupabasePlayerProgressRepository(repositories.client),
    });
    return NextResponse.json(result, { status: 200, headers: response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo marcar el tutorial de entrenamiento como completado.");
  }
}
