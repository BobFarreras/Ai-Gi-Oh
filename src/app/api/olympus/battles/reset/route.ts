// src/app/api/olympus/battles/reset/route.ts - Expone la recuperación protegida de una batalla bloqueada de Olimpo.
import { NextRequest, NextResponse } from "next/server";
import { ResetOlympusBattleUseCase } from "@/core/use-cases/olympus/ResetOlympusBattleUseCase";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { enforcePveRateLimit } from "@/services/security/api/rate-limit/enforce-pve-rate-limit";
import { createOlympusRouteContext } from "@/services/olympus/create-olympus-route-context";

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const context = await createOlympusRouteContext(request);
    const rateLimited = await enforcePveRateLimit(request, context.playerId, {
      mode: "olympus", operation: "reset", maxPerPlayer: 10, maxPerIp: 20, windowMs: 5 * 60 * 1000,
    }, context.response.headers);
    if (rateLimited) return rateLimited;
    const result = await new ResetOlympusBattleUseCase(context.repository).execute(context.playerId);
    return NextResponse.json(result, { status: 200, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo restaurar el combate de Olimpo.");
  }
}
