// middleware.ts - Protege rutas del hub con sesión activa y redirige accesos no autenticados a login.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseMiddlewareClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-middleware-client";

function isHubRoute(pathname: string): boolean {
  return pathname === "/hub" || pathname.startsWith("/hub/");
}

function isAdminPortalRoute(pathname: string): boolean {
  return pathname === "/admin-portal" || pathname.startsWith("/admin-portal/");
}

function isAdminEntryRoute(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

// Crawlers de buscadores/redes sociales. Si Googlebot obtiene una cookie de sesión (p. ej. tras crawlear
// /login), NO debe ser redirigido de "/" a "/hub" (que es noindex) → si no, Search Console marca la home
// como "Página con redirección" y no la indexa. Los usuarios reales sí se redirigen.
const CRAWLER_USER_AGENTS = [
  "googlebot", "bingbot", "slurp", "duckduckbot", "baiduspider", "yandex", "applebot",
  "facebookexternalhit", "twitterbot", "linkedinbot", "whatsapp", "telegrambot", "discordbot",
];

function isCrawler(userAgent: string | null): boolean {
  if (!userAgent) return false;
  const lower = userAgent.toLowerCase();
  return CRAWLER_USER_AGENTS.some((agent) => lower.includes(agent));
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

  const requiresSession = isHubRoute(pathname) || isAdminPortalRoute(pathname) || isAdminEntryRoute(pathname);
  if (requiresSession && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Si ya hay sesión activa, saltar la landing y entrar directo al hub. Los crawlers NUNCA se redirigen
  // desde "/": deben ver e indexar la landing pública (evita "Página con redirección" en Search Console).
  if (pathname === "/" && user && !isCrawler(request.headers.get("user-agent"))) {
    return NextResponse.redirect(new URL("/hub", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/", "/hub/:path*", "/admin/:path*", "/admin-portal/:path*"],
};
