// src/app/api/admin/arena/upsert/route.ts - Crea/edita oponentes, variantes y tiers de arena. Gate admin + escritura service-role.
import { NextRequest, NextResponse } from "next/server";
import { ValidationError } from "@/core/errors/ValidationError";
import { SupabaseAdminArenaRepository } from "@/infrastructure/persistence/supabase/admin/SupabaseAdminArenaRepository";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";
import { createAdminRouteContext } from "@/services/admin/api/create-admin-route-context";
import { readArenaOpponentCommand, readArenaTierCommand, readArenaVariantCommand } from "@/services/admin/api/read-admin-arena-command";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const context = await createAdminRouteContext(request);
    const { type, data } = (await request.json()) as { type?: string; data?: Record<string, unknown> };
    const payload = data ?? {};
    const repository = new SupabaseAdminArenaRepository(createSupabaseServiceRoleClient());
    switch (type) {
      case "opponent":
        await repository.upsertOpponent(readArenaOpponentCommand(payload));
        break;
      case "variant":
        await repository.upsertVariant(readArenaVariantCommand(payload));
        break;
      case "tier":
        await repository.upsertTier(readArenaTierCommand(payload));
        break;
      default:
        throw new ValidationError("Tipo de configuración de arena desconocido.");
    }
    return NextResponse.json({ ok: true }, { status: 200, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo guardar la configuración de arena.");
  }
}
