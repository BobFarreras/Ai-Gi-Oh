// src/app/api/training/matches/complete/route.ts - Registra cierre de combate de entrenamiento con progreso y recompensas escaladas.
import { NextRequest, NextResponse } from "next/server";
import { SupabasePlayerProgressRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerProgressRepository";
import { getAuthenticatedUserId } from "@/services/auth/api/internal/get-authenticated-user-id";
import { createPlayerRouteRepositories } from "@/services/player-persistence/create-player-route-repositories";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { readJsonObjectBody } from "@/services/security/api/request-body-parser";
import { processTrainingMatchCompletion } from "./internal/process-training-match-completion";

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const response = NextResponse.json({ ok: true }, { status: 200 });
    const repositories = await createPlayerRouteRepositories(request, response);
    const playerId = await getAuthenticatedUserId(repositories.client);
    const payload = await readJsonObjectBody(request, "Payload inválido para cierre de entrenamiento.");
    const result = await processTrainingMatchCompletion({
      playerId,
      payload,
      dependencies: {
        claimRepository: repositories.trainingMatchClaimRepository,
        trainingProgressRepository: repositories.trainingProgressRepository,
        walletRepository: repositories.walletRepository,
        playerProgressRepository: new SupabasePlayerProgressRepository(repositories.client),
      },
    });
    return NextResponse.json(result, { status: 200, headers: response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo registrar el cierre del combate de entrenamiento.");
  }
}
