// src/app/api/admin/objects/snapshot/route.ts - Devuelve el snapshot admin de objetos del mercado (para refrescar
// tras guardar). Solo lectura; protegido por la frontera admin.
import { NextRequest, NextResponse } from "next/server";
import { createAdminShopObjectsContext } from "@/services/admin/api/create-admin-shop-objects-context";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";

export async function GET(request: NextRequest) {
  try {
    const context = await createAdminShopObjectsContext(request);
    const snapshot = await context.getSnapshotUseCase.execute();
    return NextResponse.json(snapshot, { status: 200, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo cargar el snapshot de objetos del mercado.");
  }
}
