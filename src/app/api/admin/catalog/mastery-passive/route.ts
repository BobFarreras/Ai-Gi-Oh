// src/app/api/admin/catalog/mastery-passive/route.ts - Endpoint admin para leer y asignar la pasiva mastery V5 de una carta. Gate admin + escritura service_role.
import { NextRequest, NextResponse } from "next/server";
import { ValidationError } from "@/core/errors/ValidationError";
import { SupabaseCardMasteryPassiveAdminRepository } from "@/infrastructure/persistence/supabase/admin/SupabaseCardMasteryPassiveAdminRepository";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";
import { createAdminRouteContext } from "@/services/admin/api/create-admin-route-context";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";

function assertNonEmpty(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) throw new ValidationError(`${field} es obligatorio.`);
  return value;
}

export async function GET(request: NextRequest) {
  try {
    const context = await createAdminRouteContext(request);
    const repository = new SupabaseCardMasteryPassiveAdminRepository(createSupabaseServiceRoleClient());
    const [passives, assignments] = await Promise.all([repository.listActivePassives(), repository.listAssignments()]);
    return NextResponse.json({ passives, assignments }, { status: 200, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudieron cargar las pasivas mastery.");
  }
}

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const context = await createAdminRouteContext(request);
    const { cardId, passiveSkillId } = (await request.json()) as { cardId?: unknown; passiveSkillId?: unknown };
    const validCardId = assertNonEmpty(cardId, "La carta");
    const validPassiveId = assertNonEmpty(passiveSkillId, "La pasiva");
    const repository = new SupabaseCardMasteryPassiveAdminRepository(createSupabaseServiceRoleClient());
    // Rechaza ids fuera del catálogo activo para no dejar mapeos huérfanos.
    const passives = await repository.listActivePassives();
    if (!passives.some((passive) => passive.id === validPassiveId)) {
      throw new ValidationError("La pasiva seleccionada no existe o no está activa.");
    }
    await repository.upsertAssignment(validCardId, validPassiveId);
    return NextResponse.json({ ok: true }, { status: 200, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo guardar la pasiva de la carta.");
  }
}
