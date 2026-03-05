// middleware.ts - Protege rutas del hub con sesión activa y redirige accesos no autenticados a login.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseMiddlewareClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-middleware-client";

function isHubRoute(pathname: string): boolean {
  return pathname === "/hub" || pathname.startsWith("/hub/");
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;

  if (request.method !== "GET") {
    return response;
  }

  if (request.headers.has("next-action")) {
    return response;
  }

  const supabase = createSupabaseMiddlewareClient(request, response);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isHubRoute(pathname) && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/hub/:path*"],
};
