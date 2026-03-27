// src/infrastructure/persistence/supabase/internal/create-supabase-service-role-client.ts - Crea cliente Supabase server-only con service role para operaciones administrativas controladas.
import { createClient } from "@supabase/supabase-js";
import { ValidationError } from "@/core/errors/ValidationError";

/**
 * Debe usarse únicamente tras validar autenticación y autorización admin.
 */
export function createSupabaseServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url?.trim()) throw new ValidationError("Falta NEXT_PUBLIC_SUPABASE_URL.");
  if (!serviceRoleKey?.trim()) throw new ValidationError("Falta SUPABASE_SERVICE_ROLE_KEY.");
  return createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

