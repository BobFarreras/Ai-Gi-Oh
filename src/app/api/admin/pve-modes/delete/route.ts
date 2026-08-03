// src/app/api/admin/pve-modes/delete/route.ts - Retira leyendas y nodos de Olimpo, archivándolos si ya tienen historial.
import { NextRequest, NextResponse } from "next/server";
import { ValidationError } from "@/core/errors/ValidationError";
import { createAdminPveModesContext } from "@/services/admin/api/create-admin-pve-modes-context";
import { consumeAdminMutationRateLimit } from "@/services/admin/api/security/admin-rate-limiter";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const context = await createAdminPveModesContext(request);
    const allowed = await consumeAdminMutationRateLimit(request, context.profile.userId, "pve-modes");
    if (!allowed) {
      return NextResponse.json(
        { ok: false, message: "Demasiadas mutaciones administrativas. Espera 1 minuto e inténtalo de nuevo." },
        { status: 429, headers: context.response.headers },
      );
    }
    const { type, id } = (await request.json()) as { type?: string; id?: unknown };
    if (typeof id !== "string" || !id.trim()) throw new ValidationError("El identificador es obligatorio.");
    // Nunca se publica una configuración vacía: los rulesets y settings solo se archivan publicando otra versión.
    if (type === "legend") await context.repository.deleteLegend(id.trim());
    else if (type === "node") await context.repository.deleteNode(id.trim());
    else throw new ValidationError("Solo se pueden retirar leyendas y nodos.");
    await context.writeAuditLogUseCase.execute({
      actorUserId: context.profile.userId,
      action: type === "legend" ? "ADMIN_OLYMPUS_LEGEND_REMOVED" : "ADMIN_OLYMPUS_NODE_REMOVED",
      entityType: type === "legend" ? "olympus_opponents" : "olympus_champion_upgrade_nodes",
      entityId: id.trim(),
      payload: {},
    });
    return NextResponse.json({ ok: true }, { status: 200, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo retirar el elemento de los modos PvE.");
  }
}
