// src/app/api/olympus/overview/route.ts - Devuelve catálogo, intentos y progreso de Olimpo ya resueltos en servidor.
import { NextRequest, NextResponse } from "next/server";
import { GetOlympusOverviewUseCase } from "@/core/use-cases/olympus/GetOlympusOverviewUseCase";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { enforcePveRateLimit } from "@/services/security/api/rate-limit/enforce-pve-rate-limit";
import { createOlympusRouteContext } from "@/services/olympus/create-olympus-route-context";

export async function GET(request: NextRequest) {
  try {
    const context = await createOlympusRouteContext(request);
    const rateLimited = await enforcePveRateLimit(request, context.playerId, {
      mode: "olympus", operation: "overview", maxPerPlayer: 120, maxPerIp: 240, windowMs: 5 * 60 * 1000,
    }, context.response.headers);
    if (rateLimited) return rateLimited;
    const overview = await new GetOlympusOverviewUseCase(context.repository).execute(context.playerId);
    return NextResponse.json(overview, { status: 200, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo cargar el Olimpo.");
  }
}
