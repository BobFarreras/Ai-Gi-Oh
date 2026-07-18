// src/app/api/progression/skill-tree/route.ts - Devuelve el estado del árbol de habilidades del jugador
// (ficha 8): catálogo activo + rangos + nivel/puntos por nodo, para pintar la constelación. Solo lectura.
import { NextResponse } from "next/server";
import { SupabasePlayerProgressRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerProgressRepository";
import { SupabaseSkillTreeRepository } from "@/infrastructure/persistence/supabase/SupabaseSkillTreeRepository";
import { createSupabaseServerClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-server-client";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { GetSkillTreeStateUseCase } from "@/core/use-cases/progression/GetSkillTreeStateUseCase";

export async function GET() {
  try {
    const session = await getCurrentUserSession();
    if (!session?.user.id) return NextResponse.json({ tree: null }, { status: 200 });
    const client = await createSupabaseServerClient();
    const tree = await new GetSkillTreeStateUseCase(
      new SupabaseSkillTreeRepository(client),
      new SupabasePlayerProgressRepository(client),
    ).execute(session.user.id);
    return NextResponse.json({ tree }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo cargar el árbol de habilidades.");
  }
}
