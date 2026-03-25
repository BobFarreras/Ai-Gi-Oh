// src/services/admin/assert-admin-access.ts - Verifica sesión y rol admin para páginas server-side del portal administrativo.
import { AuthorizationError } from "@/core/errors/AuthorizationError";
import { IAdminProfile } from "@/core/repositories/IAdminAccessRepository";
import { EnsureAdminAccessUseCase } from "@/core/use-cases/admin/EnsureAdminAccessUseCase";
import { SupabaseAdminAccessRepository } from "@/infrastructure/persistence/supabase/SupabaseAdminAccessRepository";
import { createSupabaseServerClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-server-client";

/**
 * Exige sesión válida y pertenencia a `admin_users` para permitir acceso al portal.
 */
export async function assertAdminAccess(): Promise<IAdminProfile> {
  const client = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) throw new AuthorizationError("Debes iniciar sesión para acceder al panel administrativo.");
  const accessRepository = new SupabaseAdminAccessRepository(client);
  const ensureAdminAccessUseCase = new EnsureAdminAccessUseCase(accessRepository);
  return ensureAdminAccessUseCase.execute(user.id);
}
