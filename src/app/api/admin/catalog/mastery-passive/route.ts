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

/**
 * Aplica la pasiva elegida en el campo correcto: innata (cards_catalog, desde V1, fuera del mapa V5)
 * o de maestría (card_mastery_passive_map, solo a V5). Limpiar = quitar de ambos sitios.
 */
async function applyPassiveAssignment(
  repository: SupabaseCardMasteryPassiveAdminRepository,
  cardId: string,
  passiveSkillId: string,
  innate: boolean,
): Promise<void> {
  if (passiveSkillId === "") {
    await repository.removeAssignment(cardId);
    await repository.setInnatePassive(cardId, null);
    return;
  }
  if (innate) {
    await repository.setInnatePassive(cardId, passiveSkillId);
    await repository.removeAssignment(cardId);
    return;
  }
  await repository.upsertAssignment(cardId, passiveSkillId);
  await repository.setInnatePassive(cardId, null);
}

export async function GET(request: NextRequest) {
  try {
    const context = await createAdminRouteContext(request);
    const repository = new SupabaseCardMasteryPassiveAdminRepository(createSupabaseServiceRoleClient());
    const [passives, assignments, innateAssignments] = await Promise.all([
      repository.listActivePassives(),
      repository.listAssignments(),
      repository.listInnateAssignments(),
    ]);
    return NextResponse.json({ passives, assignments, innateAssignments }, { status: 200, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudieron cargar las pasivas mastery.");
  }
}

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const context = await createAdminRouteContext(request);
    const { cardId, passiveSkillId, innate } = (await request.json()) as {
      cardId?: unknown;
      passiveSkillId?: unknown;
      innate?: unknown;
    };
    const validCardId = assertNonEmpty(cardId, "La carta");
    // passiveSkillId vacío = limpiar la pasiva de la carta.
    const requestedPassiveId = typeof passiveSkillId === "string" ? passiveSkillId.trim() : "";
    const repository = new SupabaseCardMasteryPassiveAdminRepository(createSupabaseServiceRoleClient());
    // Rechaza ids fuera del catálogo activo para no dejar mapeos huérfanos.
    if (requestedPassiveId !== "") {
      const passives = await repository.listActivePassives();
      if (!passives.some((passive) => passive.id === requestedPassiveId)) {
        throw new ValidationError("La pasiva seleccionada no existe o no está activa.");
      }
    }
    await applyPassiveAssignment(repository, validCardId, requestedPassiveId, innate === true);
    return NextResponse.json({ ok: true }, { status: 200, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo guardar la pasiva de la carta.");
  }
}
