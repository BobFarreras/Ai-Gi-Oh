// src/app/api/market/buy-item/route.ts - Compra un objeto del mercado (USB Raro).
// El precio lo pone el catálogo del servidor; del cliente solo llegan el objeto y la clave de operación, que es
// lo que impide que un doble clic cobre dos veces.
import { NextRequest, NextResponse } from "next/server";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { readJsonObjectBody } from "@/services/security/api/request-body-parser";
import { buyShopItem, getShopItems } from "@/services/market/shop-items";

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const payload = await readJsonObjectBody(request, "Payload inválido para la compra.");
    const result = await buyShopItem(
      typeof payload.itemId === "string" ? payload.itemId : "",
      typeof payload.operationId === "string" ? payload.operationId : "",
    );
    // Devolvemos el catálogo actualizado para que la UI refleje el nuevo "tienes N" sin recargar.
    const items = await getShopItems();
    return NextResponse.json({ nexus: result.nexus, items }, { status: 200 });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo completar la compra. Revisa tu saldo de Nexus.");
  }
}
