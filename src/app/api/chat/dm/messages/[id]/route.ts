// src/app/api/chat/dm/messages/[id]/route.ts - Borrado (soft) de un mensaje privado PROPIO.
import { NextRequest, NextResponse } from "next/server";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { SupabaseDirectMessageRepository } from "@/infrastructure/persistence/supabase/SupabaseDirectMessageRepository";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";

interface IDmMessageRouteContext {
  params: Promise<{ id: string }> | { id: string };
}

export async function DELETE(request: NextRequest, context: IDmMessageRouteContext) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const session = await getCurrentUserSession();
    if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    const resolvedParams = "then" in context.params ? await context.params : context.params;
    const repository = new SupabaseDirectMessageRepository(createSupabaseServiceRoleClient());
    const deleted = await repository.softDeleteOwn(resolvedParams.id, session.user.id);
    if (!deleted) return NextResponse.json({ error: "No puedes borrar este mensaje." }, { status: 403 });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo borrar el mensaje.");
  }
}
