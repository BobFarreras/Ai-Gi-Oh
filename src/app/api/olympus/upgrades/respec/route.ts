// src/app/api/olympus/upgrades/respec/route.ts - Reasigna el árbol de un campeón cobrando lo que fija la configuración activa.
import { NextRequest, NextResponse } from "next/server";
import { ManageChampionUpgradesUseCase } from "@/core/use-cases/olympus/ManageChampionUpgradesUseCase";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { readJsonObjectBody, readRequiredStringField } from "@/services/security/api/request-body-parser";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { enforcePveRateLimit } from "@/services/security/api/rate-limit/enforce-pve-rate-limit";
import { createOlympusRouteContext } from "@/services/olympus/create-olympus-route-context";

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const context = await createOlympusRouteContext(request);
    const rateLimited = await enforcePveRateLimit(request, context.playerId, {
      mode: "olympus", operation: "respec", maxPerPlayer: 20, maxPerIp: 40, windowMs: 5 * 60 * 1000,
    }, context.response.headers);
    if (rateLimited) return rateLimited;
    const body = await readJsonObjectBody(request, "Payload inválido para reasignar el árbol.");
    const championId = readRequiredStringField(body, "championId", "El campeón es obligatorio.");
    const result = await new ManageChampionUpgradesUseCase(context.repository)
      .respec(context.playerId, championId);
    return NextResponse.json(result, { status: 200, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo reasignar el árbol del campeón.");
  }
}
