// src/app/api/player/onboarding/route.ts - Endpoint mutable para guardar estado de onboarding inicial del Hub.
import { NextRequest, NextResponse } from "next/server";
import { ValidationError } from "@/core/errors/ValidationError";
import { SupabasePlayerProgressRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerProgressRepository";
import { getAuthenticatedUserId } from "@/services/auth/api/internal/get-authenticated-user-id";
import { createPlayerRouteRepositories } from "@/services/player-persistence/create-player-route-repositories";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { readJsonObjectBody } from "@/services/security/api/request-body-parser";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { PlayerOnboardingAction, processPlayerOnboardingAction } from "./internal/process-player-onboarding-action";

interface IOnboardingPayload {
  action?: unknown;
}

function readOnboardingAction(payload: IOnboardingPayload): PlayerOnboardingAction {
  if (payload.action === "mark_intro_seen" || payload.action === "skip_tutorial") {
    return payload.action;
  }
  throw new ValidationError("Acción de onboarding inválida.");
}

export async function PATCH(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const response = NextResponse.json({ ok: true }, { status: 200 });
    const repositories = await createPlayerRouteRepositories(request, response);
    const playerId = await getAuthenticatedUserId(repositories.client);
    const payload = (await readJsonObjectBody(request, "Payload inválido para onboarding.")) as IOnboardingPayload;
    const action = readOnboardingAction(payload);
    const result = await processPlayerOnboardingAction({
      playerId,
      action,
      progressRepository: new SupabasePlayerProgressRepository(repositories.client),
    });
    return NextResponse.json(result, { status: 200, headers: response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo guardar el estado de onboarding.");
  }
}
