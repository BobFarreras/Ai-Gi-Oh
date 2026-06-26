// src/app/api/progression/state/route.ts - Estado de progresión en vivo del jugador (misiones + evento) para refrescar el dock sin recargar.
import { NextRequest, NextResponse } from "next/server";
import { GetMissionsUseCase } from "@/core/use-cases/progression/GetMissionsUseCase";
import { GetEventOverviewUseCase } from "@/core/use-cases/progression/GetEventOverviewUseCase";
import { SupabaseMissionRepository } from "@/infrastructure/persistence/supabase/SupabaseMissionRepository";
import { SupabaseEventRepository } from "@/infrastructure/persistence/supabase/SupabaseEventRepository";
import { createSupabaseRouteClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-route-client";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";

export async function GET(request: NextRequest) {
  try {
    const response = NextResponse.json({ ok: true }, { status: 200 });
    response.headers.set("Cache-Control", "no-store");
    const client = createSupabaseRouteClient(request, response);
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) {
      return NextResponse.json({ missions: [], event: null }, { status: 200, headers: response.headers });
    }
    const [missions, event] = await Promise.all([
      new GetMissionsUseCase(new SupabaseMissionRepository(client)).execute(),
      new GetEventOverviewUseCase(new SupabaseEventRepository(client)).execute(),
    ]);
    return NextResponse.json({ missions, event }, { status: 200, headers: response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo obtener el estado de progresión.");
  }
}
