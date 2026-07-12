// src/services/chat/get-dm-conversation.ts - Carga server-side de una conversación privada (mensajes + el
// otro participante). Devuelve null si el jugador no participa (o no hay sesión).
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";
import { SupabaseDirectMessageRepository } from "@/infrastructure/persistence/supabase/SupabaseDirectMessageRepository";
import { IDirectMessage } from "@/core/entities/chat/IDirectMessage";

export interface IDirectConversationData {
  conversationId: string;
  otherPlayerId: string;
  otherNickname: string;
  otherAvatarUrl: string | null;
  messages: IDirectMessage[];
  localPlayerId: string;
}

const INITIAL_MESSAGE_LIMIT = 60;

export async function getDirectConversation(conversationId: string): Promise<IDirectConversationData | null> {
  const session = await getCurrentUserSession();
  if (!session) return null;
  const playerId = session.user.id;
  const client = createSupabaseServiceRoleClient();

  const { data: conversation } = await client
    .from("dm_conversations")
    .select("player_low,player_high")
    .eq("id", conversationId)
    .maybeSingle<{ player_low: string; player_high: string }>();
  if (!conversation || (conversation.player_low !== playerId && conversation.player_high !== playerId)) {
    return null;
  }
  const otherPlayerId = conversation.player_low === playerId ? conversation.player_high : conversation.player_low;

  const { data: profile } = await client
    .from("player_profiles")
    .select("nickname,avatar_url")
    .eq("player_id", otherPlayerId)
    .maybeSingle<{ nickname: string; avatar_url: string | null }>();

  const repository = new SupabaseDirectMessageRepository(client);
  const messages = await repository.listMessages(conversationId, INITIAL_MESSAGE_LIMIT);
  await repository.markRead(conversationId, playerId);

  return {
    conversationId,
    otherPlayerId,
    otherNickname: profile?.nickname ?? "Duelista",
    otherAvatarUrl: profile?.avatar_url ?? null,
    messages,
    localPlayerId: playerId,
  };
}
