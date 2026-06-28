// src/app/api/admin/catalog/cards/route.ts - CRUD de cartas del catálogo desde el panel administrativo.
import { NextRequest, NextResponse } from "next/server";
import { createAdminCatalogContext } from "@/services/admin/api/create-admin-catalog-context";
import { readAdminCardCommand } from "@/services/admin/api/read-admin-catalog-command";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { consumeAdminMutationRateLimit } from "@/services/admin/api/security/admin-rate-limiter";

export async function GET(request: NextRequest) {
  try {
    const context = await createAdminCatalogContext(request);
    const snapshot = await context.getSnapshotUseCase.execute();
    const cardId = request.nextUrl.searchParams.get("id");
    if (cardId) {
      const card = snapshot.cards.find((c) => c.id === cardId);
      if (!card) return NextResponse.json({ error: "Carta no encontrada" }, { status: 404 });
      return NextResponse.json(card, { status: 200, headers: context.response.headers });
    }
    const lightweight = snapshot.cards.map((c) => ({ id: c.id, name: c.name, type: c.type, cost: c.cost }));
    return NextResponse.json(lightweight, { status: 200, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo cargar el catálogo de cartas.");
  }
}

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const context = await createAdminCatalogContext(request);
    const allowed = await consumeAdminMutationRateLimit(request, context.profile.userId, "catalog-card");
    if (!allowed) {
      return NextResponse.json(
        { ok: false, message: "Demasiadas mutaciones administrativas. Espera 1 minuto e inténtalo de nuevo." },
        { status: 429, headers: context.response.headers },
      );
    }
    const command = await readAdminCardCommand(request);
    await context.upsertCardUseCase.execute(command);
    await context.writeAuditLogUseCase.execute({
      actorUserId: context.profile.userId,
      action: "ADMIN_CATALOG_CARD_UPSERTED",
      entityType: "cards_catalog",
      entityId: command.id,
      payload: { type: command.type, isActive: command.isActive },
    });
    return NextResponse.json({ ok: true }, { status: 200, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo guardar la carta del catálogo.");
  }
}
