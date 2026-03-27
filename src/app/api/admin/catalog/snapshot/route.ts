// src/app/api/admin/catalog/snapshot/route.ts - Entrega snapshot administrativo de catálogo y mercado para panel de gestión.
import { NextRequest, NextResponse } from "next/server";
import { createAdminCatalogContext } from "@/services/admin/api/create-admin-catalog-context";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";

export async function GET(request: NextRequest) {
  try {
    const context = await createAdminCatalogContext(request);
    const snapshot = await context.getSnapshotUseCase.execute();
    return NextResponse.json(snapshot, { status: 200, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo cargar el snapshot administrativo del catálogo.");
  }
}
