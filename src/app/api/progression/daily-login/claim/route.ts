// src/app/api/progression/daily-login/claim/route.ts - Endpoint para reclamar el login diario. Idempotente y server-authoritative (identidad vía sesión / auth.uid()).
import { NextRequest, NextResponse } from "next/server";
import { SupabaseLoginStreakRepository } from "@/infrastructure/persistence/supabase/SupabaseLoginStreakRepository";
import { createSupabaseRouteClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-route-client";
import { ClaimDailyLoginUseCase } from "@/core/use-cases/progression/ClaimDailyLoginUseCase";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const response = NextResponse.json({ ok: true }, { status: 200 });
    const client = createSupabaseRouteClient(request, response);
    const repository = new SupabaseLoginStreakRepository(client);
    const result = await new ClaimDailyLoginUseCase(repository).execute();
    return NextResponse.json(result, { status: 200, headers: response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo reclamar el login diario.");
  }
}
