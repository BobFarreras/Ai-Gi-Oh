// src/services/auth/api/handle-register-request.ts - Orquesta seguridad y caso de uso de registro para endpoint de alta.
import { NextRequest, NextResponse } from "next/server";
import { SignUpWithEmailUseCase } from "@/core/use-cases/auth/SignUpWithEmailUseCase";
import { SupabaseAuthRepository } from "@/infrastructure/persistence/supabase/SupabaseAuthRepository";
import { createSupabaseRouteClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-route-client";
import { createAuthErrorResponse } from "@/services/auth/api/internal/create-auth-error-response";
import { getAuthFingerprint } from "@/services/auth/api/internal/get-auth-fingerprint";
import { readAuthCredentials } from "@/services/auth/api/internal/read-auth-credentials";
import { consumeAuthRateLimit } from "@/services/auth/api/security/auth-rate-limiter";
import { hasTrustedAuthOrigin } from "@/services/auth/api/security/validate-auth-origin";

export async function handleRegisterRequest(request: NextRequest): Promise<NextResponse> {
  if (!hasTrustedAuthOrigin(request)) {
    return NextResponse.json({ ok: false, message: "Origen de petición no confiable." }, { status: 403 });
  }

  try {
    const credentials = await readAuthCredentials(request);
    const fingerprint = getAuthFingerprint(request, credentials.email);
    const limitByIp = await consumeAuthRateLimit(`register:ip:${fingerprint.ip}`, 6, 15 * 60 * 1000);
    const limitByEmail = await consumeAuthRateLimit(`register:email:${fingerprint.emailKey}`, 4, 15 * 60 * 1000);
    if (!limitByIp || !limitByEmail) {
      return NextResponse.json({ ok: false, message: "Demasiados intentos. Espera unos minutos." }, { status: 429 });
    }

    const response = NextResponse.json({ ok: true, message: null }, { status: 200 });
    const client = createSupabaseRouteClient(request, response);
    const repository = new SupabaseAuthRepository(client);
    const useCase = new SignUpWithEmailUseCase(repository);
    await useCase.execute(credentials);
    return response;
  } catch (error) {
    return createAuthErrorResponse("REGISTER", error);
  }
}
