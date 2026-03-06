// src/infrastructure/persistence/supabase/internal/create-supabase-server-client.ts - Crea cliente Supabase server-side con bridge de cookies de Next.js.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireSupabaseEnv } from "@/infrastructure/persistence/supabase/internal/require-supabase-env";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const env = requireSupabaseEnv();
  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Ignorado en contextos donde Next no permite mutar cookies (render puro).
        }
      },
    },
  });
}
