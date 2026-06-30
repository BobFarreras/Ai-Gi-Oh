// src/app/api/admin/arena/route.ts - Devuelve el catálogo completo de arena (oponentes, tiers) y las cartas válidas para el editor. Gate admin + service-role.
import { NextRequest, NextResponse } from "next/server";
import { CARD_BY_ID } from "@/infrastructure/repositories/internal/card-catalog";
import { SupabaseAdminArenaRepository } from "@/infrastructure/persistence/supabase/admin/SupabaseAdminArenaRepository";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";
import { createAdminRouteContext } from "@/services/admin/api/create-admin-route-context";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";

export async function GET(request: NextRequest) {
  try {
    const context = await createAdminRouteContext(request);
    const repository = new SupabaseAdminArenaRepository(createSupabaseServiceRoleClient());
    const [opponents, tiers] = await Promise.all([repository.getOpponents(), repository.getTiers()]);
    // Cartas completas (no solo id/nombre) para que el editor muestre la miniatura real.
    const validCards = Array.from(CARD_BY_ID.values()).sort((a, b) => a.id.localeCompare(b.id));
    return NextResponse.json({ opponents, tiers, validCards }, { status: 200, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo cargar el catálogo de arena.");
  }
}
