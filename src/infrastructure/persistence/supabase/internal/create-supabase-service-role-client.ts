// src/infrastructure/persistence/supabase/internal/create-supabase-service-role-client.ts - Crea cliente server-only para mutaciones privilegiadas controladas.
import { createClient } from "@supabase/supabase-js";
import { ValidationError } from "@/core/errors/ValidationError";

/**
 * Debe usarse únicamente en servidor tras validar la autenticación y la autorización exigida por el caso de uso.
 */
export function createSupabaseServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url?.trim()) throw new ValidationError("Falta NEXT_PUBLIC_SUPABASE_URL.");
  if (!serviceRoleKey?.trim()) throw new ValidationError("Falta SUPABASE_SERVICE_ROLE_KEY.");
  return createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

