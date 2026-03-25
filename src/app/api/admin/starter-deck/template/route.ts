// src/app/api/admin/starter-deck/template/route.ts - Expone lectura y guardado de plantillas starter deck para panel administrativo.
import { NextRequest, NextResponse } from "next/server";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { createAdminStarterDeckContext } from "@/services/admin/api/create-admin-starter-deck-context";
import { readAdminSaveStarterDeckTemplateCommand } from "@/services/admin/api/read-admin-starter-deck-command";

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
    const command = await readAdminSaveStarterDeckTemplateCommand(request);
    const context = await createAdminStarterDeckContext(request);
    await context.saveTemplateUseCase.execute(command);
    return NextResponse.json({ ok: true }, { status: 200, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo guardar la plantilla starter deck.");
  }
}
