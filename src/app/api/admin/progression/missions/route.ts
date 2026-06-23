// src/app/api/admin/progression/missions/route.ts - Endpoint admin para crear/editar definiciones de misión. Gate de admin + escritura service_role.
import { NextRequest, NextResponse } from "next/server";
import { IAdminMissionDefinition } from "@/core/entities/progression/ILiveOpsAdmin";
import { UpsertMissionUseCase } from "@/core/use-cases/progression/admin/UpsertMissionUseCase";
import { SupabaseProgressionAdminRepository } from "@/infrastructure/persistence/supabase/SupabaseProgressionAdminRepository";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";
import { createAdminRouteContext } from "@/services/admin/api/create-admin-route-context";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const context = await createAdminRouteContext(request);
    const body = (await request.json()) as IAdminMissionDefinition;
    const repository = new SupabaseProgressionAdminRepository(createSupabaseServiceRoleClient());
    await new UpsertMissionUseCase(repository).execute(body);
    return NextResponse.json({ ok: true }, { status: 200, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo guardar la misión.");
  }
}
