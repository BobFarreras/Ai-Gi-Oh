// src/app/api/admin/starter-deck/template/route.ts - Expone lectura y guardado de plantillas starter deck para panel administrativo.
import { NextRequest, NextResponse } from "next/server";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { createAdminStarterDeckContext } from "@/services/admin/api/create-admin-starter-deck-context";
import { readAdminSaveStarterDeckTemplateCommand } from "@/services/admin/api/read-admin-starter-deck-command";
import { consumeAdminMutationRateLimit } from "@/services/admin/api/security/admin-rate-limiter";

export async function GET(request: NextRequest) {
  try {
    const context = await createAdminStarterDeckContext(request);
    const templateKey = request.nextUrl.searchParams.get("templateKey") ?? undefined;
    const data = await context.getTemplateUseCase.execute(templateKey);
    const availableCards = await context.repository.listAvailableCards();
    return NextResponse.json({ ...data, availableCards }, { status: 200, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo cargar la configuración de starter deck.");
  }
}

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const context = await createAdminStarterDeckContext(request);
    const allowed = await consumeAdminMutationRateLimit(request, context.profile.userId, "starter-deck-template");
    if (!allowed) {
      return NextResponse.json(
        { ok: false, message: "Demasiadas mutaciones administrativas. Espera 1 minuto e inténtalo de nuevo." },
        { status: 429, headers: context.response.headers },
      );
    }
    const command = await readAdminSaveStarterDeckTemplateCommand(request);
    await context.saveTemplateUseCase.execute(command);
    await context.writeAuditLogUseCase.execute({
      actorUserId: context.profile.userId,
      action: "ADMIN_STARTER_TEMPLATE_SAVED",
      entityType: "starter_deck_template_slots",
      entityId: command.templateKey,
      payload: { cardCount: command.cardIds.length, activate: command.activate },
    });
    return NextResponse.json({ ok: true }, { status: 200, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo guardar la plantilla starter deck.");
  }
}
