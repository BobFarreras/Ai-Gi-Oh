// src/app/api/progression/missions/claim/route.ts - Endpoint para reclamar la recompensa de una misión. Idempotente y server-authoritative.
import { NextRequest, NextResponse } from "next/server";
import { SupabaseMissionRepository } from "@/infrastructure/persistence/supabase/SupabaseMissionRepository";
import { createSupabaseRouteClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-route-client";
import { ClaimMissionRewardUseCase } from "@/core/use-cases/progression/ClaimMissionRewardUseCase";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { readJsonObjectBody, readRequiredStringField } from "@/services/security/api/request-body-parser";

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const payload = await readJsonObjectBody(request, "Payload inválido para reclamar misión.");
    const missionId = readRequiredStringField(payload, "missionId", "El identificador de misión es obligatorio.");
    const periodKey = readRequiredStringField(payload, "periodKey", "El periodo de la misión es obligatorio.");
    const response = NextResponse.json({ ok: true }, { status: 200 });
    const client = createSupabaseRouteClient(request, response);
    const repository = new SupabaseMissionRepository(client);
    const result = await new ClaimMissionRewardUseCase(repository).execute(missionId, periodKey);
    return NextResponse.json(result, { status: 200, headers: response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo reclamar la recompensa de la misión.");
  }
}
