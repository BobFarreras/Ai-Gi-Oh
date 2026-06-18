// src/infrastructure/persistence/supabase/internal/create-supabase-browser-client.ts - Crea cliente Supabase para componentes client con sincronización de cookies del navegador.
import { createBrowserClient } from "@supabase/ssr";
import { requireSupabaseEnv } from "@/infrastructure/persistence/supabase/internal/require-supabase-env";

export function createSupabaseBrowserClient() {
  const env = requireSupabaseEnv();
  return createBrowserClient(env.url, env.anonKey);
}
