// src/app/api/admin/catalog/packs/route.ts - Procesa alta/edición de packs y pool de cartas desde panel admin.
import { NextRequest, NextResponse } from "next/server";
import { createAdminCatalogContext } from "@/services/admin/api/create-admin-catalog-context";
import { readAdminPackCommand } from "@/services/admin/api/read-admin-catalog-command";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const command = await readAdminPackCommand(request);
    const context = await createAdminCatalogContext(request);
    await context.upsertPackUseCase.execute(command);
    return NextResponse.json({ ok: true }, { status: 200, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo guardar el pack de mercado.");
  }
}
