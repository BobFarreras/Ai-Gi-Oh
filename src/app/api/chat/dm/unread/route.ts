// src/app/api/chat/dm/unread/route.ts - Total de mensajes privados NO leídos del jugador (para el badge del botón de chat).
import { NextResponse } from "next/server";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { SupabaseDirectMessageRepository } from "@/infrastructure/persistence/supabase/SupabaseDirectMessageRepository";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";

export async function GET() {
  try {
    const session = await getCurrentUserSession();
    if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    const repository = new SupabaseDirectMessageRepository(createSupabaseServiceRoleClient());
    const conversations = await repository.listConversations(session.user.id);
    const count = conversations.reduce((sum, conversation) => sum + conversation.unreadCount, 0);
    return NextResponse.json({ count }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo obtener el estado de mensajes.");
  }
}
