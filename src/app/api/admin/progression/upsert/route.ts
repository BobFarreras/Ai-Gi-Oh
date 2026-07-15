// src/app/api/admin/progression/upsert/route.ts - Endpoint admin único para crear/editar cualquier definición de live-ops. Gate de admin + escritura service_role.
import { NextRequest, NextResponse } from "next/server";
import { ValidationError } from "@/core/errors/ValidationError";
import { UpsertMissionUseCase } from "@/core/use-cases/progression/admin/UpsertMissionUseCase";
import { UpsertPromotionUseCase } from "@/core/use-cases/progression/admin/UpsertPromotionUseCase";
import { SupabaseProgressionAdminRepository } from "@/infrastructure/persistence/supabase/SupabaseProgressionAdminRepository";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";
import { createAdminRouteContext } from "@/services/admin/api/create-admin-route-context";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";

function assertPositiveInt(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) throw new ValidationError(`${field} debe ser un entero positivo.`);
  return value;
}
function assertNonNegInt(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) throw new ValidationError(`${field} debe ser un entero no negativo.`);
  return value;
}
function assertNonEmpty(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) throw new ValidationError(`${field} es obligatorio.`);
  return value;
}

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const context = await createAdminRouteContext(request);
    const { type, data } = (await request.json()) as { type: string; data: Record<string, unknown> };
    const repository = new SupabaseProgressionAdminRepository(createSupabaseServiceRoleClient());

    switch (type) {
      case "mission":
        await new UpsertMissionUseCase(repository).execute(data as never);
        break;
      case "promotion":
        await new UpsertPromotionUseCase(repository).execute(data as never);
        break;
      case "event":
        assertNonEmpty(data.id, "El id del evento");
        assertNonEmpty(data.name, "El nombre del evento");
        assertNonEmpty(data.currencyName, "La moneda del evento");
        await repository.upsertEvent(data as never);
        break;
      case "eventRule":
        assertNonEmpty(data.eventId, "El evento");
        assertNonEmpty(data.actionType, "La acción");
        assertPositiveInt(data.pointsPer, "Los puntos");
        await repository.upsertEventRule(data as never);
        break;
      case "eventShopItem": {
        assertNonEmpty(data.id, "El id del item");
        assertNonEmpty(data.eventId, "El evento");
        const rewardKind = data.rewardKind === undefined ? "CARD" : data.rewardKind;
        if (rewardKind !== "CARD" && rewardKind !== "LEVEL_CANDY" && rewardKind !== "CARD_UPGRADE") {
          throw new ValidationError("Tipo de premio de item inválido.");
        }
        if (rewardKind === "CARD") assertNonEmpty(data.cardId, "La carta");
        else assertNonEmpty(data.objectId, "El objeto");
        assertPositiveInt(data.costPoints, "El coste en puntos");
        assertPositiveInt(data.perPlayerLimit, "El límite por jugador");
        await repository.upsertEventShopItem({ ...data, rewardKind } as never);
        break;
      }
      case "loginDay":
        assertPositiveInt(data.dayIndex, "El día");
        assertNonNegInt(data.rewardNexus, "La recompensa Nexus");
        if (data.rewardType !== "NEXUS" && data.rewardType !== "CARD") throw new ValidationError("Tipo de recompensa inválido.");
        await repository.upsertLoginRewardDay(data as never);
        break;
      default:
        throw new ValidationError("Tipo de definición desconocido.");
    }

    return NextResponse.json({ ok: true }, { status: 200, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo guardar la definición de live-ops.");
  }
}
