// src/app/api/chat/dm/read/route.ts - Marca una conversación privada como leída por el jugador actual.
import { NextRequest, NextResponse } from "next/server";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { readJsonObjectBody } from "@/services/security/api/request-body-parser";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { SupabaseDirectMessageRepository } from "@/infrastructure/persistence/supabase/SupabaseDirectMessageRepository";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const session = await getCurrentUserSession();
    if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    const payload = await readJsonObjectBody(request, "Payload inválido.");
    const conversationId = typeof payload.conversationId === "string" ? payload.conversationId : "";
    if (!conversationId) return NextResponse.json({ error: "Conversación obligatoria." }, { status: 400 });
    const repository = new SupabaseDirectMessageRepository(createSupabaseServiceRoleClient());
    if (!(await repository.isParticipant(conversationId, session.user.id))) {
      return NextResponse.json({ error: "No participas en esta conversación." }, { status: 403 });
    }
    await repository.markRead(conversationId, session.user.id);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo marcar como leída.");
  }
}
