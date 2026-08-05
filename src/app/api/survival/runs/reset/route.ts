// src/app/api/survival/runs/reset/route.ts - Restaura una expedición bloqueada mediante operaciones autoritativas.
import { NextRequest, NextResponse } from "next/server";
import { ResetSurvivalRunUseCase } from "@/core/use-cases/survival/ResetSurvivalRunUseCase";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { createSurvivalRouteContext } from "@/services/survival/create-survival-route-context";
import { enforcePveRateLimit } from "@/services/security/api/rate-limit/enforce-pve-rate-limit";
import { getSurvivalStartingLp } from "@/services/survival/get-survival-starting-lp";

const SURVIVAL_BASE_MAX_LP = 8000;

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const context = await createSurvivalRouteContext(request);
    const rateLimited = await enforcePveRateLimit(request, context.playerId, {
      mode: "survival", operation: "reset", maxPerPlayer: 10, maxPerIp: 20, windowMs: 5 * 60 * 1000,
    }, context.response.headers);
    if (rateLimited) return rateLimited;
    const maxLp = await getSurvivalStartingLp(context.playerId, SURVIVAL_BASE_MAX_LP);
    const result = await new ResetSurvivalRunUseCase(context.repository).execute(context.playerId, maxLp);
    return NextResponse.json(result, { status: 201, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo restaurar la expedición de Supervivencia.");
  }
}
