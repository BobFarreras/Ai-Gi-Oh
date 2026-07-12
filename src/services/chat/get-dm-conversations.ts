// src/services/chat/get-dm-conversations.ts - Carga server-side de la lista de conversaciones privadas.
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";
import { SupabaseDirectMessageRepository } from "@/infrastructure/persistence/supabase/SupabaseDirectMessageRepository";
import { IDirectConversation } from "@/core/entities/chat/IDirectMessage";

export interface IDirectConversationsData {
  conversations: IDirectConversation[];
  localPlayerId: string | null;
}

export async function getDirectConversations(): Promise<IDirectConversationsData> {
  const session = await getCurrentUserSession();
  if (!session) return { conversations: [], localPlayerId: null };
  const repository = new SupabaseDirectMessageRepository(createSupabaseServiceRoleClient());
  const conversations = await repository.listConversations(session.user.id);
  return { conversations, localPlayerId: session.user.id };
}
