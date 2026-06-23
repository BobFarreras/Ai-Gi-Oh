// src/app/api/admin/progression/promotions/route.ts - Endpoint admin para crear/editar promociones/noticias. Gate de admin + escritura service_role.
import { NextRequest, NextResponse } from "next/server";
import { IAdminPromotionConfig } from "@/core/entities/progression/ILiveOpsAdmin";
import { UpsertPromotionUseCase } from "@/core/use-cases/progression/admin/UpsertPromotionUseCase";
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
    const body = (await request.json()) as IAdminPromotionConfig;
    const repository = new SupabaseProgressionAdminRepository(createSupabaseServiceRoleClient());
    await new UpsertPromotionUseCase(repository).execute(body);
    return NextResponse.json({ ok: true }, { status: 200, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo guardar la promoción.");
  }
}
