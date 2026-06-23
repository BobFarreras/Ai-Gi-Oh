// src/app/api/admin/analytics/dashboard/route.ts - Expone dashboard de analytics admin con datos de los últimos 30 días, solo lectura.
import { NextRequest, NextResponse } from "next/server";
import { createAdminAnalyticsContext } from "@/services/admin/api/create-admin-analytics-context";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";

export async function GET(request: NextRequest) {
  try {
    const context = await createAdminAnalyticsContext(request);
    const dashboard = await context.getDashboardUseCase.execute();
    return NextResponse.json(dashboard, { status: 200, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo cargar el dashboard de analytics.");
  }
}
