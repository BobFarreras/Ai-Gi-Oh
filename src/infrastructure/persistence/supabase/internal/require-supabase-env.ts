// src/infrastructure/persistence/supabase/internal/require-supabase-env.ts - Valida y expone configuración mínima de Supabase para servidor.
import { ValidationError } from "@/core/errors/ValidationError";

interface ISupabaseEnv {
  url: string;
  anonKey: string;
}

export function requireSupabaseEnv(): ISupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim()) {
    throw new ValidationError("Falta NEXT_PUBLIC_SUPABASE_URL.");
  }
  if (!anonKey?.trim()) {
    throw new ValidationError("Falta NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
  return { url, anonKey };
}
