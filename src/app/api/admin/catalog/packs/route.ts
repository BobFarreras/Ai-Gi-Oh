// src/app/api/admin/catalog/packs/route.ts - Procesa alta/edición de packs y pool de cartas desde panel admin.
import { NextRequest, NextResponse } from "next/server";
import { createAdminCatalogContext } from "@/services/admin/api/create-admin-catalog-context";
import { readAdminPackCommand } from "@/services/admin/api/read-admin-catalog-command";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { consumeAdminMutationRateLimit } from "@/services/admin/api/security/admin-rate-limiter";

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const context = await createAdminCatalogContext(request);
    const allowed = await consumeAdminMutationRateLimit(request, context.profile.userId, "catalog-pack");
    if (!allowed) {
      return NextResponse.json(
        { ok: false, message: "Demasiadas mutaciones administrativas. Espera 1 minuto e inténtalo de nuevo." },
        { status: 429, headers: context.response.headers },
      );
    }
    const command = await readAdminPackCommand(request);
    await context.upsertPackUseCase.execute(command);
    await context.writeAuditLogUseCase.execute({
      actorUserId: context.profile.userId,
      action: "ADMIN_MARKET_PACK_UPSERTED",
      entityType: "market_pack_definitions",
      entityId: command.id,
      payload: { cardsPerPack: command.cardsPerPack, poolEntryCount: command.poolEntries.length, isAvailable: command.isAvailable },
    });
    return NextResponse.json({ ok: true }, { status: 200, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo guardar el pack de mercado.");
  }
}
