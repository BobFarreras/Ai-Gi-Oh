// src/app/api/chat/dm/messages/route.ts - Lee (GET) y envía (POST) mensajes de una conversación privada.
// Auth + origin + rate limit + comprobación de pertenencia. Escrituras con service-role validado por sesión.
import { NextRequest, NextResponse } from "next/server";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { readJsonObjectBody } from "@/services/security/api/request-body-parser";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { SupabaseDirectMessageRepository } from "@/infrastructure/persistence/supabase/SupabaseDirectMessageRepository";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";
import { SendDirectMessageUseCase } from "@/core/use-cases/chat/SendDirectMessageUseCase";
import { CHAT_RATE_LIMIT_MAX, CHAT_RATE_LIMIT_WINDOW_MS } from "@/core/services/chat/chat-rate-limit";
import { buildCardShareMetadata } from "@/services/chat/build-card-share-metadata";

const DEFAULT_LIMIT = 60;
const MAX_LIMIT = 100;

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUserSession();
    if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    const params = request.nextUrl.searchParams;
    const conversationId = params.get("conversationId") ?? "";
    if (!conversationId) return NextResponse.json({ error: "Conversación obligatoria." }, { status: 400 });
    const repository = new SupabaseDirectMessageRepository(createSupabaseServiceRoleClient());
    if (!(await repository.isParticipant(conversationId, session.user.id))) {
      return NextResponse.json({ error: "No participas en esta conversación." }, { status: 403 });
    }
    const limitParam = params.get("limit");
    const limit = Math.min(limitParam ? Number.parseInt(limitParam, 10) || DEFAULT_LIMIT : DEFAULT_LIMIT, MAX_LIMIT);
    const messages = await repository.listMessages(conversationId, limit, params.get("before"));
    // Abrir la conversación cuenta como leerla.
    await repository.markRead(conversationId, session.user.id);
    return NextResponse.json({ messages }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudieron cargar los mensajes.");
  }
}

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const session = await getCurrentUserSession();
    if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    const userId = session.user.id;
    const payload = await readJsonObjectBody(request, "Payload inválido.");
    const repository = new SupabaseDirectMessageRepository(createSupabaseServiceRoleClient());
    // Rate limit anti-spam contado en BD (robusto entre instancias serverless).
    const sinceIso = new Date(Date.now() - CHAT_RATE_LIMIT_WINDOW_MS).toISOString();
    if ((await repository.countRecentBySender(userId, sinceIso)) >= CHAT_RATE_LIMIT_MAX) {
      return NextResponse.json({ error: "Vas demasiado rápido. Espera unos segundos." }, { status: 429 });
    }
    // Igual que en el chat de comunidad: del cliente solo se acepta el cardId; la instantánea de la carta
    // (nombre, stats e imágenes) la construye el servidor desde la colección real del jugador.
    const kind = payload.kind === "CARD_SHARE" ? "CARD_SHARE" : "TEXT";
    const metadata = kind === "CARD_SHARE"
      ? await buildCardShareMetadata(userId, (payload.metadata as Record<string, unknown> | undefined)?.cardId)
      : undefined;
    const message = await new SendDirectMessageUseCase(repository).execute({
      senderId: userId,
      conversationId: typeof payload.conversationId === "string" ? payload.conversationId : "",
      content: typeof payload.content === "string" ? payload.content : "",
      kind,
      metadata,
      replyToMessageId: typeof payload.replyToMessageId === "string" ? payload.replyToMessageId : null,
    });
    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo enviar el mensaje.");
  }
}
