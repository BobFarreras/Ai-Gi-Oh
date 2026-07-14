// src/app/api/market/items/route.ts - Catálogo de objetos del mercado (USB Raro) con lo que ya posee el jugador.
import { NextResponse } from "next/server";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { getShopItems } from "@/services/market/shop-items";

export async function GET() {
  try {
    const items = await getShopItems();
    return NextResponse.json({ items }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudieron cargar los objetos.");
  }
}
