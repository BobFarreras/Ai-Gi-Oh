// src/app/api/survival/runs/start/route.ts - Inicia o reanuda una expedición Survival autenticada.
import { NextRequest, NextResponse } from "next/server";
import { StartSurvivalRunUseCase } from "@/core/use-cases/survival/StartSurvivalRunUseCase";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { createSurvivalRouteContext } from "@/services/survival/create-survival-route-context";
import { enforcePveRateLimit } from "@/services/security/api/rate-limit/enforce-pve-rate-limit";

const SURVIVAL_BASE_MAX_LP = 8000;

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const context = await createSurvivalRouteContext(request);
    const rateLimited = await enforcePveRateLimit(request, context.playerId, {
      mode: "survival", operation: "start", maxPerPlayer: 30, maxPerIp: 60, windowMs: 5 * 60 * 1000,
    }, context.response.headers);
    if (rateLimited) return rateLimited;
    const result = await new StartSurvivalRunUseCase(context.repository)
      .execute(context.playerId, SURVIVAL_BASE_MAX_LP);
    return NextResponse.json(result, { status: result.resumed ? 200 : 201, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo iniciar la expedición de Supervivencia.");
  }
}
