// src/app/api/market/buy-card/route.ts - Ejecuta compra de carta individual y devuelve catálogo actualizado.
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
    const payload = await readJsonObjectBody(request, "Payload inválido para compra de carta.");
    const listingId = readRequiredStringField(payload, "listingId", "El listingId es obligatorio.");
    const context = await createMarketRouteContext(request);
    await context.buyCardUseCase.execute({ playerId: context.playerId, listingId });
    const [catalog, transactions, collection] = await Promise.all([
      context.getCatalogUseCase.execute(context.playerId),
      context.getTransactionsUseCase.execute(context.playerId),
      context.repositories.collectionRepository.getCollection(context.playerId),
    ]);
    const snapshot: IMarketRuntimeSnapshot = { catalog, transactions, collection };
    return NextResponse.json(snapshot, { status: 200, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo completar la compra de carta. Revisa saldo Nexus, stock y disponibilidad.");
  }
}
