// src/app/api/progression/upgrade/history/route.ts - Historial de objetos aplicados por el jugador (rastro
// visible de la ficha 9b: qué objeto, a qué carta y cuándo). Solo lectura del propio jugador (RLS).
import { NextResponse } from "next/server";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { getPlayerCardUpgradeHistory } from "@/services/progression/get-player-card-upgrade-history";

export async function GET() {
  try {
    const entries = await getPlayerCardUpgradeHistory();
    return NextResponse.json({ entries }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo cargar el historial de objetos.");
  }
}
