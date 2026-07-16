// src/app/api/admin/objects/upgrade/route.ts - Alta/edición de un objeto de mejora (card_upgrade_items) desde admin.
import { NextRequest, NextResponse } from "next/server";
import { createAdminShopObjectsContext } from "@/services/admin/api/create-admin-shop-objects-context";
import { readAdminCardUpgradeItemCommand } from "@/services/admin/api/read-admin-shop-object-command";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { consumeAdminMutationRateLimit } from "@/services/admin/api/security/admin-rate-limiter";

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const context = await createAdminShopObjectsContext(request);
    const allowed = await consumeAdminMutationRateLimit(request, context.profile.userId, "objects-upgrade");
    if (!allowed) {
      return NextResponse.json(
        { ok: false, message: "Demasiadas mutaciones administrativas. Espera 1 minuto e inténtalo de nuevo." },
        { status: 429, headers: context.response.headers },
      );
    }
    const command = await readAdminCardUpgradeItemCommand(request);
    await context.upsertUpgradeItemUseCase.execute(command);
    await context.writeAuditLogUseCase.execute({
      actorUserId: context.profile.userId,
      action: "ADMIN_SHOP_UPGRADE_ITEM_UPSERTED",
      entityType: "card_upgrade_items",
      entityId: command.id,
      payload: { name: command.name, stat: command.stat, value: command.value, priceNexus: command.priceNexus, isActive: command.isActive },
    });
    return NextResponse.json({ ok: true }, { status: 200, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo guardar el objeto de mejora.");
  }
}
