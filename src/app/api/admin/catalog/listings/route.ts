// src/app/api/admin/catalog/listings/route.ts - Procesa alta/edición de listados de mercado desde panel admin.
import { NextRequest, NextResponse } from "next/server";
import { createAdminCatalogContext } from "@/services/admin/api/create-admin-catalog-context";
import { readAdminListingCommand } from "@/services/admin/api/read-admin-catalog-command";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { consumeAdminMutationRateLimit } from "@/services/admin/api/security/admin-rate-limiter";

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const context = await createAdminCatalogContext(request);
    const allowed = await consumeAdminMutationRateLimit(request, context.profile.userId, "catalog-listing");
    if (!allowed) {
      return NextResponse.json(
        { ok: false, message: "Demasiadas mutaciones administrativas. Espera 1 minuto e inténtalo de nuevo." },
        { status: 429, headers: context.response.headers },
      );
    }
    const command = await readAdminListingCommand(request);
    await context.upsertListingUseCase.execute(command);
    await context.writeAuditLogUseCase.execute({
      actorUserId: context.profile.userId,
      action: "ADMIN_MARKET_LISTING_UPSERTED",
      entityType: "market_card_listings",
      entityId: command.id,
      payload: { cardId: command.cardId, isAvailable: command.isAvailable, stock: command.stock },
    });
    return NextResponse.json({ ok: true }, { status: 200, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo guardar el listing de mercado.");
  }
}
