// src/services/chat/get-recent-chat-messages.ts - Carga server-side de los mensajes recientes de una sala (para el LCP de la página del chat).
import { IChatMessage } from "@/core/entities/chat/IChatMessage";
import { GetRecentChatMessagesUseCase } from "@/core/use-cases/chat/GetRecentChatMessagesUseCase";
import { SupabaseChatRepository } from "@/infrastructure/persistence/supabase/SupabaseChatRepository";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";

/** Devuelve los últimos mensajes de la sala; ante cualquier fallo (p.ej. migración sin aplicar) devuelve []. */
export async function getRecentChatMessages(room: string): Promise<IChatMessage[]> {
  try {
    const repository = new SupabaseChatRepository(createSupabaseServiceRoleClient());
    return await new GetRecentChatMessagesUseCase(repository).execute({ room });
  } catch {
    return [];
  }
}
