// src/app/api/admin/audit/route.ts - Expone consulta paginada de auditoría admin con filtros y control de acceso server-side.
import { NextRequest, NextResponse } from "next/server";
import { createAdminAuditContext } from "@/services/admin/api/create-admin-audit-context";
import { readAdminAuditPageQuery } from "@/services/admin/internal/read-admin-audit-query";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";

export async function GET(request: NextRequest) {
  try {
    const context = await createAdminAuditContext(request);
    const query = readAdminAuditPageQuery(request.nextUrl.searchParams);
    const page = await context.getAuditPageUseCase.execute(query);
    return NextResponse.json(page, { status: 200, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo cargar la auditoría administrativa.");
  }
}

