// src/app/api/chat/messages/[id]/route.ts - Chat de comunidad: borrado (soft) de un mensaje PROPIO.
import { NextRequest, NextResponse } from "next/server";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { SupabaseChatRepository } from "@/infrastructure/persistence/supabase/SupabaseChatRepository";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";
import { DeleteOwnChatMessageUseCase } from "@/core/use-cases/chat/DeleteOwnChatMessageUseCase";

interface IChatMessageRouteContext {
  params: Promise<{ id: string }> | { id: string };
}

export async function DELETE(request: NextRequest, context: IChatMessageRouteContext) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const session = await getCurrentUserSession();
    if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    const resolvedParams = "then" in context.params ? await context.params : context.params;
    const repository = new SupabaseChatRepository(createSupabaseServiceRoleClient());
    const deleted = await new DeleteOwnChatMessageUseCase(repository).execute({
      messageId: resolvedParams.id,
      userId: session.user.id,
    });
    if (!deleted) return NextResponse.json({ error: "No puedes borrar este mensaje." }, { status: 403 });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo borrar el mensaje.");
  }
}
