// src/app/api/progression/upgrade/apply/route.ts - Aplica un objeto de mejora (ATK/DEF) a una carta del jugador.
// Server-authoritative: el tope lo valida la RPC apply_card_upgrade; del cliente solo llegan el objeto, la carta
// y la clave de operación (que impide el doble gasto).
import { NextRequest, NextResponse } from "next/server";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { readJsonObjectBody } from "@/services/security/api/request-body-parser";
import { applyUpgradeItem } from "@/services/market/shop-items";

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const payload = await readJsonObjectBody(request, "Payload inválido.");
    await applyUpgradeItem(
      typeof payload.itemId === "string" ? payload.itemId : "",
      typeof payload.cardId === "string" ? payload.cardId : "",
      typeof payload.operationId === "string" ? payload.operationId : "",
    );
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo aplicar la mejora.");
  }
}
