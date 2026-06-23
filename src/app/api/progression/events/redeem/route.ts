// src/app/api/progression/events/redeem/route.ts - Endpoint para canjear un item de la tienda de evento. Server-authoritative (valida puntos y límite en BD).
import { NextRequest, NextResponse } from "next/server";
import { SupabaseEventRepository } from "@/infrastructure/persistence/supabase/SupabaseEventRepository";
import { createSupabaseRouteClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-route-client";
import { RedeemEventShopItemUseCase } from "@/core/use-cases/progression/RedeemEventShopItemUseCase";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { readJsonObjectBody, readRequiredStringField } from "@/services/security/api/request-body-parser";

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const payload = await readJsonObjectBody(request, "Payload inválido para canjear item de evento.");
    const itemId = readRequiredStringField(payload, "itemId", "El identificador de item es obligatorio.");
    const response = NextResponse.json({ ok: true }, { status: 200 });
    const client = createSupabaseRouteClient(request, response);
    const repository = new SupabaseEventRepository(client);
    const result = await new RedeemEventShopItemUseCase(repository).execute(itemId);
    return NextResponse.json(result, { status: 200, headers: response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo canjear el item de evento.");
  }
}
