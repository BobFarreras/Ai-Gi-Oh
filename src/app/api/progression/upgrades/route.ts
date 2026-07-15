// src/app/api/progression/upgrades/route.ts - Devuelve los bonus de objetos (ATK/DEF) que el jugador ha
// aplicado a sus cartas, para que el Arsenal muestre el margen restante y las stats mejoradas.
import { NextResponse } from "next/server";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { createSupabaseServerClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-server-client";
import { SupabasePlayerCardUpgradesRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerCardUpgradesRepository";

export async function GET() {
  try {
    const session = await getCurrentUserSession();
    if (!session?.user.id) return NextResponse.json({ upgrades: {} }, { status: 200 });
    const client = await createSupabaseServerClient();
    const map = await new SupabasePlayerCardUpgradesRepository(client).getUpgradesByPlayer(session.user.id);
    return NextResponse.json({ upgrades: Object.fromEntries(map) }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudieron cargar las mejoras.");
  }
}
