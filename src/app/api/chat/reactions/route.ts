// src/app/api/chat/reactions/route.ts - Chat de comunidad: alternar una reacción (emoji) a un mensaje.
import { NextRequest, NextResponse } from "next/server";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { readJsonObjectBody } from "@/services/security/api/request-body-parser";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { SupabaseChatRepository } from "@/infrastructure/persistence/supabase/SupabaseChatRepository";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";
import { ToggleChatReactionUseCase } from "@/core/use-cases/chat/ToggleChatReactionUseCase";

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const session = await getCurrentUserSession();
    if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    const payload = await readJsonObjectBody(request, "Payload inválido para la reacción.");
    const repository = new SupabaseChatRepository(createSupabaseServiceRoleClient());
    const result = await new ToggleChatReactionUseCase(repository).execute({
      messageId: typeof payload.messageId === "string" ? payload.messageId : "",
      userId: session.user.id,
      emoji: typeof payload.emoji === "string" ? payload.emoji : "",
    });
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo actualizar la reacción.");
  }
}
