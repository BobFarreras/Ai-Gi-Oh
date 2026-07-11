// src/services/chat/get-recent-chat-messages.ts - Carga server-side de mensajes + reacciones recientes (para el LCP de la página del chat).
import { IChatMessage } from "@/core/entities/chat/IChatMessage";
import { IChatMessageReactionSummary } from "@/core/entities/chat/IChatMessageReaction";
import { GetRecentChatMessagesUseCase } from "@/core/use-cases/chat/GetRecentChatMessagesUseCase";
import { SupabaseChatRepository } from "@/infrastructure/persistence/supabase/SupabaseChatRepository";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";

export interface IChatInitialData {
  messages: IChatMessage[];
  reactions: IChatMessageReactionSummary[];
}

/** Mensajes recientes + sus reacciones; ante cualquier fallo (p.ej. migración sin aplicar) devuelve vacío. */
export async function getRecentChatMessages(room: string, currentUserId: string): Promise<IChatInitialData> {
  try {
    const repository = new SupabaseChatRepository(createSupabaseServiceRoleClient());
    const messages = await new GetRecentChatMessagesUseCase(repository).execute({ room });
    const reactions = await repository.getReactionsForMessages(messages.map((message) => message.id), currentUserId);
    return { messages, reactions };
  } catch {
    return { messages: [], reactions: [] };
  }
}
