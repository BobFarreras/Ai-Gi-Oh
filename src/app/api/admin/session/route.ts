// src/app/api/admin/session/route.ts - Expone estado de sesión admin para validar wiring de autorización en el bloque administrativo.
import { NextRequest, NextResponse } from "next/server";
import { createAdminRouteContext } from "@/services/admin/api/create-admin-route-context";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";

export async function GET(request: NextRequest) {
  try {
    const context = await createAdminRouteContext(request);
    return NextResponse.json(
      {
        ok: true,
        userId: context.profile.userId,
        role: context.profile.role,
      },
      { status: 200, headers: context.response.headers },
    );
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo validar la sesión administrativa.");
  }
}
