// src/services/auth/api/handle-login-request.ts - Orquesta seguridad y caso de uso de login para mantener route.ts libre de lógica.
import { NextRequest, NextResponse } from "next/server";
import { SignInWithEmailUseCase } from "@/core/use-cases/auth/SignInWithEmailUseCase";
import { SupabaseAuthRepository } from "@/infrastructure/persistence/supabase/SupabaseAuthRepository";
import { createSupabaseRouteClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-route-client";
import { createAuthErrorResponse } from "@/services/auth/api/internal/create-auth-error-response";
import { getAuthFingerprint } from "@/services/auth/api/internal/get-auth-fingerprint";
import { readAuthCredentials } from "@/services/auth/api/internal/read-auth-credentials";
import { consumeAuthRateLimit } from "@/services/auth/api/security/auth-rate-limiter";
import { hasTrustedAuthOrigin } from "@/services/auth/api/security/validate-auth-origin";

export async function handleLoginRequest(request: NextRequest): Promise<NextResponse> {
  if (!hasTrustedAuthOrigin(request)) {
    return NextResponse.json({ ok: false, message: "Origen de petición no confiable." }, { status: 403 });
  }

  try {
    const credentials = await readAuthCredentials(request);
    const fingerprint = getAuthFingerprint(request, credentials.email);
    const limitByIp = consumeAuthRateLimit(`login:ip:${fingerprint.ip}`, 10, 10 * 60 * 1000);
    const limitByEmail = consumeAuthRateLimit(`login:email:${fingerprint.emailKey}`, 8, 10 * 60 * 1000);
    if (!limitByIp || !limitByEmail) {
      return NextResponse.json({ ok: false, message: "Demasiados intentos. Espera unos minutos." }, { status: 429 });
    }

    const response = NextResponse.json({ ok: true, message: null }, { status: 200 });
    const client = createSupabaseRouteClient(request, response);
    const repository = new SupabaseAuthRepository(client);
    const useCase = new SignInWithEmailUseCase(repository);
    await useCase.execute(credentials);
    return response;
  } catch (error) {
    return createAuthErrorResponse("LOGIN", error);
  }
}
