// src/infrastructure/persistence/supabase/SupabaseDirectMessageRepository.ts - Persistencia de los mensajes
// privados 1-a-1 sobre Supabase. Todas las escrituras van con service-role (la identidad del jugador la
// valida el endpoint desde la sesión); las lecturas de resumen usan la RPC dm_list_conversations(p_self).
import { SupabaseClient } from "@supabase/supabase-js";
import { DirectMessageKind, IDirectConversation, IDirectMessage } from "@/core/entities/chat/IDirectMessage";
import { IDirectMessageRepository, IInsertDirectMessageInput } from "@/core/repositories/IDirectMessageRepository";
import { ValidationError } from "@/core/errors/ValidationError";

interface IDmMessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  kind: DirectMessageKind;
  metadata: Record<string, unknown> | null;
  reply_to_message_id: string | null;
  created_at: string;
}

interface IDmConversationSummaryRow {
  conversation_id: string;
  other_id: string;
  other_nickname: string | null;
  other_avatar_url: string | null;
  last_message_at: string;
  last_preview: string | null;
  last_kind: string | null;
  unread_count: number;
}

const DM_ROW_COLUMNS = "id,conversation_id,sender_id,content,kind,metadata,reply_to_message_id,created_at";

function mapMessage(row: IDmMessageRow): IDirectMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    content: row.content,
    kind: row.kind,
    metadata: row.metadata ?? {},
    replyToMessageId: row.reply_to_message_id ?? null,
    createdAtIso: row.created_at,
  };
}

/** Extracto legible para la lista de conversaciones (una carta compartida se muestra como 🃏). */
function buildPreview(kind: string | null, content: string | null): string {
  if (!content) return "";
  return kind === "CARD_SHARE" ? "🃏 Carta compartida" : content;
}

export class SupabaseDirectMessageRepository implements IDirectMessageRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getOrCreateConversation(playerId: string, otherPlayerId: string): Promise<string> {
    if (playerId === otherPlayerId) throw new ValidationError("No puedes abrir una conversación contigo mismo.");
    const [low, high] = playerId < otherPlayerId ? [playerId, otherPlayerId] : [otherPlayerId, playerId];
    // El FK a auth.users garantiza que el destinatario exista (un id inventado falla el insert).
    const insertion = await this.client
      .from("dm_conversations")
      .insert({ player_low: low, player_high: high })
      .select("id")
      .maybeSingle<{ id: string }>();
    if (insertion.data?.id) return insertion.data.id;
    // Ya existía (conflicto de unicidad) o el insert no devolvió fila: se recupera.
    const { data, error } = await this.client
      .from("dm_conversations")
      .select("id")
      .eq("player_low", low)
      .eq("player_high", high)
      .maybeSingle<{ id: string }>();
    if (error || !data?.id) throw new ValidationError("No se pudo abrir la conversación.");
    return data.id;
  }

  async listConversations(playerId: string): Promise<IDirectConversation[]> {
    const { data, error } = await this.client.rpc("dm_list_conversations", { p_self: playerId });
    if (error || !data) return [];
    return (data as IDmConversationSummaryRow[]).map((row) => ({
      id: row.conversation_id,
      otherPlayerId: row.other_id,
      otherNickname: row.other_nickname ?? "Duelista",
      otherAvatarUrl: row.other_avatar_url ?? null,
      lastMessageAtIso: row.last_message_at,
      lastMessagePreview: buildPreview(row.last_kind, row.last_preview),
      unreadCount: row.unread_count ?? 0,
    }));
  }

  async isParticipant(conversationId: string, playerId: string): Promise<boolean> {
    const { data } = await this.client
      .from("dm_conversations")
      .select("player_low,player_high")
      .eq("id", conversationId)
      .maybeSingle<{ player_low: string; player_high: string }>();
    return !!data && (data.player_low === playerId || data.player_high === playerId);
  }

  async listMessages(conversationId: string, limit: number, beforeIso?: string | null): Promise<IDirectMessage[]> {
    let query = this.client
      .from("dm_messages")
      .select(DM_ROW_COLUMNS)
      .eq("conversation_id", conversationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (beforeIso) query = query.lt("created_at", beforeIso);
    const { data, error } = await query;
    if (error) throw new ValidationError("No se pudieron cargar los mensajes.");
    return ((data ?? []) as IDmMessageRow[]).map(mapMessage).reverse();
  }

  async insert(input: IInsertDirectMessageInput): Promise<IDirectMessage> {
    const { data, error } = await this.client
      .from("dm_messages")
      .insert({
        conversation_id: input.conversationId,
        sender_id: input.senderId,
        content: input.content,
        kind: input.kind,
        metadata: input.metadata,
        reply_to_message_id: input.replyToMessageId,
      })
      .select(DM_ROW_COLUMNS)
      .single<IDmMessageRow>();
    if (error || !data) throw new ValidationError("No se pudo enviar el mensaje.");
    // Sube la conversación al principio de la lista y la marca como leída para el emisor.
    await this.client
      .from("dm_conversations")
      .update({ last_message_at: data.created_at })
      .eq("id", input.conversationId);
    await this.markRead(input.conversationId, input.senderId);
    return mapMessage(data);
  }

  async markRead(conversationId: string, playerId: string): Promise<void> {
    const { data } = await this.client
      .from("dm_conversations")
      .select("player_low,player_high")
      .eq("id", conversationId)
      .maybeSingle<{ player_low: string; player_high: string }>();
    if (!data) return;
    const column = data.player_low === playerId ? "player_low_read_at" : "player_high_read_at";
    await this.client
      .from("dm_conversations")
      .update({ [column]: new Date().toISOString() })
      .eq("id", conversationId);
  }

  async countRecentBySender(senderId: string, sinceIso: string): Promise<number> {
    const { count, error } = await this.client
      .from("dm_messages")
      .select("id", { count: "exact", head: true })
      .eq("sender_id", senderId)
      .gte("created_at", sinceIso);
    if (error) throw new ValidationError("No se pudo verificar el ritmo de mensajes.");
    return count ?? 0;
  }

  async softDeleteOwn(messageId: string, senderId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from("dm_messages")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", messageId)
      .eq("sender_id", senderId)
      .is("deleted_at", null)
      .select("id");
    if (error) throw new ValidationError("No se pudo borrar el mensaje.");
    return (data?.length ?? 0) > 0;
  }
}
