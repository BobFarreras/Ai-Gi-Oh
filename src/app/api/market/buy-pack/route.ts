// src/app/api/market/buy-pack/route.ts - Ejecuta compra de sobre y devuelve cartas abiertas junto al catálogo actualizado.
import { NextRequest, NextResponse } from "next/server";
import { createMarketRouteContext } from "@/app/api/market/internal/create-market-route-context";
import { IMarketRuntimeSnapshot } from "@/services/market/market-runtime-snapshot";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { readJsonObjectBody, readRequiredStringField } from "@/services/security/api/request-body-parser";

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const payload = await readJsonObjectBody(request, "Payload inválido para compra de sobre.");
    const packId = readRequiredStringField(payload, "packId", "El packId es obligatorio.");
    const context = await createMarketRouteContext(request);
    const openedCardIds = await context.buyPackUseCase.execute({ playerId: context.playerId, packId });
    const [catalog, transactions, collection] = await Promise.all([
      context.getCatalogUseCase.execute(context.playerId),
      context.getTransactionsUseCase.execute(context.playerId),
      context.repositories.collectionRepository.getCollection(context.playerId),
    ]);
    const snapshot: IMarketRuntimeSnapshot = { catalog, transactions, collection };
    return NextResponse.json({ ...snapshot, openedCardIds }, { status: 200, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo completar la compra del sobre. Revisa saldo Nexus y disponibilidad del pack.");
  }
}
