// src/app/api/chat/dm/conversations/route.ts - Lista las conversaciones privadas (GET) y abre/recupera una
// conversación con otro jugador (POST). Auth + origin. Escrituras con service-role validado por sesión.
import { NextRequest, NextResponse } from "next/server";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { readJsonObjectBody } from "@/services/security/api/request-body-parser";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { SupabaseDirectMessageRepository } from "@/infrastructure/persistence/supabase/SupabaseDirectMessageRepository";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";

export async function GET() {
  try {
    const session = await getCurrentUserSession();
    if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    const repository = new SupabaseDirectMessageRepository(createSupabaseServiceRoleClient());
    const conversations = await repository.listConversations(session.user.id);
    return NextResponse.json({ conversations }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudieron cargar las conversaciones.");
  }
}

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const session = await getCurrentUserSession();
    if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    const payload = await readJsonObjectBody(request, "Payload inválido.");
    const otherPlayerId = typeof payload.otherPlayerId === "string" ? payload.otherPlayerId : "";
    if (!otherPlayerId) return NextResponse.json({ error: "Destinatario obligatorio." }, { status: 400 });
    const repository = new SupabaseDirectMessageRepository(createSupabaseServiceRoleClient());
    const conversationId = await repository.getOrCreateConversation(session.user.id, otherPlayerId);
    return NextResponse.json({ conversationId }, { status: 200 });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo abrir la conversación.");
  }
}
