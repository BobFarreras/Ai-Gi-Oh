// src/app/api/olympus/champions/deck/route.ts - Devuelve el mazo prestado de un campeón, resuelto como saldrá a combatir.
import { NextRequest, NextResponse } from "next/server";
import { ValidationError } from "@/core/errors/ValidationError";
import { createOlympusRouteContext } from "@/services/olympus/create-olympus-route-context";
import { resolveChampionDeckPreview } from "@/services/olympus/resolve-champion-deck-preview";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { enforcePveRateLimit } from "@/services/security/api/rate-limit/enforce-pve-rate-limit";

export async function GET(request: NextRequest) {
  try {
    const context = await createOlympusRouteContext(request);
    const rateLimited = await enforcePveRateLimit(request, context.playerId, {
      mode: "olympus", operation: "deck", maxPerPlayer: 120, maxPerIp: 240, windowMs: 5 * 60 * 1000,
    }, context.response.headers);
    if (rateLimited) return rateLimited;
    const championId = request.nextUrl.searchParams.get("championId");
    if (!championId?.trim()) throw new ValidationError("El campeón es obligatorio.");
    const preview = await resolveChampionDeckPreview(context.repository, context.playerId, championId.trim());
    return NextResponse.json(preview, { status: 200, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo cargar el mazo del campeón.");
  }
}
