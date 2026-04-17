// src/services/auth/handle-auth-callback-request.ts - Resuelve callback de auth intercambiando código y redirigiendo de forma segura.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-route-client";

function resolveSafeNextPath(nextPath: string | null): string {
  if (!nextPath || !nextPath.startsWith("/")) {
    return "/hub";
  }
  if (nextPath.startsWith("//") || nextPath.includes("\\") || nextPath.includes("\n") || nextPath.includes("\r")) {
    return "/hub";
  }
  return nextPath;
}

/**
 * Completa callback de recuperación y persistencia de sesión en cookies server-side.
 */
export async function handleAuthCallbackRequest(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextPath = resolveSafeNextPath(url.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_auth_code", request.url));
  }

  const response = NextResponse.redirect(new URL(nextPath, request.url));
  const client = createSupabaseRouteClient(request, response);
  const { error } = await client.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/login?error=invalid_recovery_session", request.url));
  }
  return response;
}
