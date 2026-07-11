// src/app/api/chat/messages/route.ts - Chat de comunidad: leer mensajes recientes (GET) y enviar (POST). Auth + origin + rate limit.
import { NextRequest, NextResponse } from "next/server";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { readJsonObjectBody } from "@/services/security/api/request-body-parser";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { getPlayerDisplayName } from "@/services/player-profile/get-player-display-name";
import { SupabaseChatRepository } from "@/infrastructure/persistence/supabase/SupabaseChatRepository";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";
import { GetRecentChatMessagesUseCase } from "@/core/use-cases/chat/GetRecentChatMessagesUseCase";
import { SendChatMessageUseCase } from "@/core/use-cases/chat/SendChatMessageUseCase";
import { CHAT_RATE_LIMIT_MAX, CHAT_RATE_LIMIT_WINDOW_MS } from "@/core/services/chat/chat-rate-limit";

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUserSession();
    if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    const params = request.nextUrl.searchParams;
    const limitParam = params.get("limit");
    const repository = new SupabaseChatRepository(createSupabaseServiceRoleClient());
    const messages = await new GetRecentChatMessagesUseCase(repository).execute({
      room: params.get("room") ?? undefined,
      beforeIso: params.get("before"),
      limit: limitParam ? Number.parseInt(limitParam, 10) : undefined,
    });
    const reactions = await repository.getReactionsForMessages(messages.map((message) => message.id), session.user.id);
    return NextResponse.json({ messages, reactions }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudieron cargar los mensajes del chat.");
  }
}

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const session = await getCurrentUserSession();
    if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    const userId = session.user.id;
    const payload = await readJsonObjectBody(request, "Payload inválido para el chat.");
    const repository = new SupabaseChatRepository(createSupabaseServiceRoleClient());
    // Rate limit anti-spam contado en BD (robusto entre instancias serverless, sin depender de Upstash).
    const sinceIso = new Date(Date.now() - CHAT_RATE_LIMIT_WINDOW_MS).toISOString();
    if ((await repository.countRecentByUser(userId, sinceIso)) >= CHAT_RATE_LIMIT_MAX) {
      return NextResponse.json({ error: "Vas demasiado rápido. Espera unos segundos antes de enviar más mensajes." }, { status: 429 });
    }
    const nickname = await getPlayerDisplayName(session, "Operador");
    const message = await new SendChatMessageUseCase(repository).execute({
      userId,
      nickname,
      room: typeof payload.room === "string" ? payload.room : undefined,
      content: typeof payload.content === "string" ? payload.content : "",
      kind: typeof payload.kind === "string" ? payload.kind : undefined,
      metadata: payload.metadata && typeof payload.metadata === "object" ? (payload.metadata as Record<string, unknown>) : undefined,
    });
    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo enviar el mensaje.");
  }
}
