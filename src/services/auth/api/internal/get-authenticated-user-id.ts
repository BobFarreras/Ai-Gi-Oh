// src/services/auth/api/internal/get-authenticated-user-id.ts - Obtiene el identificador del usuario autenticado para endpoints protegidos.
import { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/core/errors/ValidationError";

export async function getAuthenticatedUserId(client: SupabaseClient): Promise<string> {
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) {
    throw new ValidationError("Sesión inválida para esta operación.");
  }
  return user.id;
}
