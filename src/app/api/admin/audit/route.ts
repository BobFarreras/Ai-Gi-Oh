// src/app/api/admin/audit/route.ts - Expone consulta paginada de auditoría admin con filtros y control de acceso server-side.
import { NextRequest, NextResponse } from "next/server";
import { GetAdminAuditLogPageUseCase } from "@/core/use-cases/admin/GetAdminAuditLogPageUseCase";
import { SupabaseAdminAuditLogRepository } from "@/infrastructure/persistence/supabase/admin/SupabaseAdminAuditLogRepository";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";
import { createAdminRouteContext } from "@/services/admin/api/create-admin-route-context";
import { readAdminAuditPageQuery } from "@/services/admin/internal/read-admin-audit-query";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";

export async function GET(request: NextRequest) {
  try {
    const context = await createAdminRouteContext(request);
    const repository = new SupabaseAdminAuditLogRepository(createSupabaseServiceRoleClient());
    const useCase = new GetAdminAuditLogPageUseCase(repository);
    const query = readAdminAuditPageQuery(request.nextUrl.searchParams);
    const page = await useCase.execute(query);
    return NextResponse.json(page, { status: 200, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo cargar la auditoría administrativa.");
  }
}

