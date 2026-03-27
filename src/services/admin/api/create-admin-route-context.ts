// src/services/admin/api/create-admin-route-context.ts - Construye contexto autenticado/autorizado para endpoints administrativos.
import { NextRequest, NextResponse } from "next/server";
import { AuthorizationError } from "@/core/errors/AuthorizationError";
import { IAdminProfile } from "@/core/repositories/IAdminAccessRepository";
import { EnsureAdminAccessUseCase } from "@/core/use-cases/admin/EnsureAdminAccessUseCase";
import { SupabaseAdminAccessRepository } from "@/infrastructure/persistence/supabase/SupabaseAdminAccessRepository";
import { createSupabaseRouteClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-route-client";

export interface IAdminRouteContext {
  response: NextResponse;
  profile: IAdminProfile;
}

/**
 * Valida sesión y rol admin para reutilizar la misma frontera de seguridad en `/api/admin/*`.
 */
export async function createAdminRouteContext(request: NextRequest): Promise<IAdminRouteContext> {
  const response = NextResponse.json({ ok: true }, { status: 200 });
  response.headers.set("Cache-Control", "no-store");
  const client = createSupabaseRouteClient(request, response);
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) throw new AuthorizationError("Debes iniciar sesión para operar en endpoints administrativos.");
  const repository = new SupabaseAdminAccessRepository(client);
  const useCase = new EnsureAdminAccessUseCase(repository);
  return { response, profile: await useCase.execute(user.id) };
}
