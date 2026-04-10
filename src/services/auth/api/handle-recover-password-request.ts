// src/services/auth/api/handle-recover-password-request.ts - Orquesta recuperación de contraseña con seguridad y respuesta neutra ante enumeración.
import { NextRequest, NextResponse } from "next/server";
import { RequestPasswordRecoveryUseCase } from "@/core/use-cases/auth/RequestPasswordRecoveryUseCase";
import { SupabaseAuthRepository } from "@/infrastructure/persistence/supabase/SupabaseAuthRepository";
import { createSupabaseRouteClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-route-client";
import { createAuthErrorResponse } from "@/services/auth/api/internal/create-auth-error-response";
import { getAuthFingerprint } from "@/services/auth/api/internal/get-auth-fingerprint";
import { readAuthEmail } from "@/services/auth/api/internal/read-auth-email";
import { resolvePasswordRecoveryRedirect } from "@/services/auth/api/internal/resolve-password-recovery-redirect";
import { consumeAuthRateLimit } from "@/services/auth/api/security/auth-rate-limiter";
import { hasTrustedAuthOrigin } from "@/services/auth/api/security/validate-auth-origin";

export async function handleRecoverPasswordRequest(request: NextRequest): Promise<NextResponse> {
  if (!hasTrustedAuthOrigin(request)) {
    return NextResponse.json({ ok: false, message: "Origen de petición no confiable." }, { status: 403 });
  }

  try {
    const email = await readAuthEmail(request);
    const fingerprint = getAuthFingerprint(request, email);
    const limitByIp = await consumeAuthRateLimit(`recover:ip:${fingerprint.ip}`, 6, 15 * 60 * 1000);
    const limitByEmail = await consumeAuthRateLimit(`recover:email:${fingerprint.emailKey}`, 4, 15 * 60 * 1000);
    if (!limitByIp || !limitByEmail) {
      return NextResponse.json({ ok: false, message: "Demasiados intentos. Espera unos minutos." }, { status: 429 });
    }

    const response = NextResponse.json({
      ok: true,
      message: "Si existe una cuenta con ese email, enviaremos un enlace de recuperación.",
    });
    const client = createSupabaseRouteClient(request, response);
    const repository = new SupabaseAuthRepository(client);
    const useCase = new RequestPasswordRecoveryUseCase(repository);
    await useCase.execute({ email, redirectTo: resolvePasswordRecoveryRedirect(request) });
    return response;
  } catch (error) {
    return createAuthErrorResponse("RECOVER_PASSWORD", error);
  }
}
