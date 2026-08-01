// src/app/api/admin/pve-modes/route.ts - Devuelve la configuración completa de Supervivencia y Olimpo para el panel admin.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";
import { loadAllActiveCards } from "@/infrastructure/persistence/supabase/internal/load-all-active-cards";
import { createAdminPveModesContext } from "@/services/admin/api/create-admin-pve-modes-context";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";

export async function GET(request: NextRequest) {
  try {
    const context = await createAdminPveModesContext(request);
    // Mismo almacén de cartas que Arena y Story: el editor de decks legendarios no tiene catálogo propio.
    const [snapshot, validCards] = await Promise.all([
      context.repository.getSnapshot(),
      loadAllActiveCards(createSupabaseServiceRoleClient()),
    ]);
    return NextResponse.json({ ...snapshot, validCards }, { status: 200, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo cargar la configuración de los modos PvE.");
  }
}
