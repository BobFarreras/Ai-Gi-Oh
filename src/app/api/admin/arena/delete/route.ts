// src/app/api/admin/arena/delete/route.ts - Elimina oponentes, variantes o tiers de arena. Gate admin + escritura service-role.
import { NextRequest, NextResponse } from "next/server";
import { ValidationError } from "@/core/errors/ValidationError";
import { SupabaseAdminArenaRepository } from "@/infrastructure/persistence/supabase/admin/SupabaseAdminArenaRepository";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";
import { createAdminRouteContext } from "@/services/admin/api/create-admin-route-context";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const context = await createAdminRouteContext(request);
    const { type, id } = (await request.json()) as { type?: string; id?: unknown };
    const repository = new SupabaseAdminArenaRepository(createSupabaseServiceRoleClient());
    switch (type) {
      case "opponent":
        await repository.deleteOpponent(String(id));
        break;
      case "variant":
        await repository.deleteVariant(String(id));
        break;
      case "tier":
        await repository.deleteTier(Number(id));
        break;
      default:
        throw new ValidationError("Tipo de eliminación de arena desconocido.");
    }
    return NextResponse.json({ ok: true }, { status: 200, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo eliminar la configuración de arena.");
  }
}
