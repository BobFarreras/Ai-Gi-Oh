// src/services/survival/create-survival-route-context.ts - Compone clientes autenticado y privilegiado para rutas Survival.
import { NextRequest, NextResponse } from "next/server";
import { SupabaseSurvivalRepository } from "@/infrastructure/persistence/supabase/SupabaseSurvivalRepository";
import { createSupabaseRouteClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-route-client";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";
import { getAuthenticatedUserId } from "@/services/auth/api/internal/get-authenticated-user-id";

/** Conserva lectura bajo RLS y limita service_role exclusivamente a las RPCs de escritura. */
export async function createSurvivalRouteContext(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  const readClient = createSupabaseRouteClient(request, response);
  const playerId = await getAuthenticatedUserId(readClient);
  const repository = new SupabaseSurvivalRepository(readClient, createSupabaseServiceRoleClient());
  return { playerId, repository, response };
}
