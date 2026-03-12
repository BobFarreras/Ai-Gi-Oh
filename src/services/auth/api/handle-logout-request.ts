// src/services/auth/api/handle-logout-request.ts - Orquesta cierre de sesión con validación de origen y control de abuso.
import { NextRequest, NextResponse } from "next/server";
import { SignOutUseCase } from "@/core/use-cases/auth/SignOutUseCase";
import { SupabaseAuthRepository } from "@/infrastructure/persistence/supabase/SupabaseAuthRepository";
import { createSupabaseRouteClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-route-client";
import { createAuthErrorResponse } from "@/services/auth/api/internal/create-auth-error-response";
import { consumeAuthRateLimit } from "@/services/auth/api/security/auth-rate-limiter";
import { hasTrustedAuthOrigin } from "@/services/auth/api/security/validate-auth-origin";

export async function handleLogoutRequest(request: NextRequest): Promise<NextResponse> {
  if (!hasTrustedAuthOrigin(request)) {
    return NextResponse.json({ ok: false, message: "Origen de petición no confiable." }, { status: 403 });
  }

  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown-ip";
  const isAllowed = await consumeAuthRateLimit(`logout:ip:${clientIp}`, 20, 10 * 60 * 1000);
  if (!isAllowed) {
    return NextResponse.json({ ok: false, message: "Demasiadas peticiones de cierre de sesión." }, { status: 429 });
  }

  try {
    const response = NextResponse.json({ ok: true, message: null }, { status: 200 });
    const client = createSupabaseRouteClient(request, response);
    const repository = new SupabaseAuthRepository(client);
    const useCase = new SignOutUseCase(repository);
    await useCase.execute();
    return response;
  } catch (error) {
    return createAuthErrorResponse("LOGOUT", error);
  }
}
