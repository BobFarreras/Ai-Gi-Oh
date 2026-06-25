// src/app/api/admin/progression/delete/route.ts - Endpoint admin para eliminar definiciones de live-ops. Gate de admin + escritura service_role.
import { NextRequest, NextResponse } from "next/server";
import { ValidationError } from "@/core/errors/ValidationError";
import { DeleteMissionUseCase } from "@/core/use-cases/progression/admin/DeleteMissionUseCase";
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
    const { type, id } = (await request.json()) as { type: string; id: string };
    if (typeof id !== "string" || !id.trim()) throw new ValidationError("El id es obligatorio.");
    const repository = new SupabaseProgressionAdminRepository(createSupabaseServiceRoleClient());

    switch (type) {
      case "mission":
        await new DeleteMissionUseCase(repository).execute(id);
        break;
      default:
        throw new ValidationError("Tipo de definición desconocido para eliminar.");
    }

    return NextResponse.json({ ok: true }, { status: 200, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo eliminar la definición de live-ops.");
  }
}
