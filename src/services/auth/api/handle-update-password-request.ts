// src/services/auth/api/handle-update-password-request.ts - Orquesta actualización de contraseña para sesiones de recuperación activas.
import { NextRequest, NextResponse } from "next/server";
import { UpdatePasswordUseCase } from "@/core/use-cases/auth/UpdatePasswordUseCase";
import { SupabaseAuthRepository } from "@/infrastructure/persistence/supabase/SupabaseAuthRepository";
import { createSupabaseRouteClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-route-client";
import { createAuthErrorResponse } from "@/services/auth/api/internal/create-auth-error-response";
import { consumeAuthRateLimit } from "@/services/auth/api/security/auth-rate-limiter";
import { hasTrustedAuthOrigin } from "@/services/auth/api/security/validate-auth-origin";
import { readAuthNewPassword } from "@/services/auth/api/internal/read-auth-new-password";

export async function handleUpdatePasswordRequest(request: NextRequest): Promise<NextResponse> {
  if (!hasTrustedAuthOrigin(request)) {
    return NextResponse.json({ ok: false, message: "Origen de petición no confiable." }, { status: 403 });
  }

  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown-ip";
  const isAllowed = await consumeAuthRateLimit(`update-password:ip:${clientIp}`, 8, 10 * 60 * 1000);
  if (!isAllowed) {
    return NextResponse.json({ ok: false, message: "Demasiados intentos. Espera unos minutos." }, { status: 429 });
  }

  try {
    const password = await readAuthNewPassword(request);
    const response = NextResponse.json({ ok: true, message: "Contraseña actualizada correctamente." }, { status: 200 });
    const client = createSupabaseRouteClient(request, response);
    const repository = new SupabaseAuthRepository(client);
    const useCase = new UpdatePasswordUseCase(repository);
    await useCase.execute({ password });
    return response;
  } catch (error) {
    return createAuthErrorResponse("UPDATE_PASSWORD", error);
  }
}
