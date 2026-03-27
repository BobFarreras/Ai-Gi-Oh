// src/app/api/admin/catalog/packs/[packId]/route.ts - Elimina pack de mercado admin de forma segura con confirmación server-side.
import { NextRequest, NextResponse } from "next/server";
import { createAdminCatalogContext } from "@/services/admin/api/create-admin-catalog-context";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { consumeAdminMutationRateLimit } from "@/services/admin/api/security/admin-rate-limiter";

interface IDeletePackRouteContext {
  params: Promise<{ packId: string }> | { packId: string };
}

export async function DELETE(request: NextRequest, context: IDeletePackRouteContext) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const resolvedParams = "then" in context.params ? await context.params : context.params;
    const catalogContext = await createAdminCatalogContext(request);
    const allowed = await consumeAdminMutationRateLimit(request, catalogContext.profile.userId, "catalog-pack-delete");
    if (!allowed) {
      return NextResponse.json(
        { ok: false, message: "Demasiadas mutaciones administrativas. Espera 1 minuto e inténtalo de nuevo." },
        { status: 429, headers: catalogContext.response.headers },
      );
    }
    await catalogContext.deletePackUseCase.execute(resolvedParams.packId);
    await catalogContext.writeAuditLogUseCase.execute({
      actorUserId: catalogContext.profile.userId,
      action: "ADMIN_MARKET_PACK_DELETED",
      entityType: "market_pack_definitions",
      entityId: resolvedParams.packId,
      payload: {},
    });
    return NextResponse.json({ ok: true }, { status: 200, headers: catalogContext.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo eliminar el pack de mercado.");
  }
}
