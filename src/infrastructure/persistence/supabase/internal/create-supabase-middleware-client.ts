// src/infrastructure/persistence/supabase/internal/create-supabase-middleware-client.ts - Crea cliente Supabase para middleware con sincronización de cookies.
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { requireSupabaseEnv } from "@/infrastructure/persistence/supabase/internal/require-supabase-env";

export function createSupabaseMiddlewareClient(request: NextRequest, response: NextResponse) {
  const env = requireSupabaseEnv();
  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
}
