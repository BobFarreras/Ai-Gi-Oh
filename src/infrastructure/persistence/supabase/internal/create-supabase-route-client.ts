// src/infrastructure/persistence/supabase/internal/create-supabase-route-client.ts - Crea cliente Supabase para route handlers con sincronización de cookies en respuesta.
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { requireSupabaseEnv } from "@/infrastructure/persistence/supabase/internal/require-supabase-env";

export function createSupabaseRouteClient(request: NextRequest, response: NextResponse) {
  const env = requireSupabaseEnv();
  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
}
