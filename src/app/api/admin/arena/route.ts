// src/app/api/admin/arena/route.ts - Devuelve el catálogo completo de arena (oponentes, tiers) y las cartas válidas para el editor. Gate admin + service-role.
import { NextRequest, NextResponse } from "next/server";
import { SupabaseAdminArenaRepository } from "@/infrastructure/persistence/supabase/admin/SupabaseAdminArenaRepository";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";
import { loadAllActiveCards } from "@/infrastructure/persistence/supabase/internal/load-all-active-cards";
import { createAdminRouteContext } from "@/services/admin/api/create-admin-route-context";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";

export async function GET(request: NextRequest) {
  try {
    const context = await createAdminRouteContext(request);
    const serviceClient = createSupabaseServiceRoleClient();
    const repository = new SupabaseAdminArenaRepository(serviceClient);
    // Almacén con TODAS las cartas activas del juego (no solo el catálogo en código).
    const [opponents, tiers, validCards] = await Promise.all([repository.getOpponents(), repository.getTiers(), loadAllActiveCards(serviceClient)]);
    return NextResponse.json({ opponents, tiers, validCards }, { status: 200, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo cargar el catálogo de arena.");
  }
}
