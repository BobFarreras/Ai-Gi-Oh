// src/infrastructure/persistence/supabase/SupabaseChatRepository.ts - Persistencia del chat de comunidad sobre Supabase.
import { SupabaseClient } from "@supabase/supabase-js";
import { ChatMessageKind, IChatMessage } from "@/core/entities/chat/IChatMessage";
import { IChatMessageReactionSummary } from "@/core/entities/chat/IChatMessageReaction";
import { IChatRepository, IInsertChatMessageInput } from "@/core/repositories/IChatRepository";
import { ValidationError } from "@/core/errors/ValidationError";

interface IChatReactionRow {
  message_id: string;
  user_id: string;
  emoji: string;
}

interface IChatMessageRow {
  id: string;
  room: string;
  user_id: string;
  nickname: string;
  content: string;
  kind: ChatMessageKind;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const CHAT_ROW_COLUMNS = "id,room,user_id,nickname,content,kind,metadata,created_at";

function mapRow(row: IChatMessageRow): IChatMessage {
  return {
    id: row.id,
    room: row.room,
    userId: row.user_id,
    nickname: row.nickname,
    content: row.content,
    kind: row.kind,
    metadata: row.metadata ?? {},
    createdAtIso: row.created_at,
  };
}

export class SupabaseChatRepository implements IChatRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listRecent(room: string, limit: number, beforeIso?: string | null): Promise<IChatMessage[]> {
    let query = this.client
      .from("chat_messages")
      .select(CHAT_ROW_COLUMNS)
      .eq("room", room)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (beforeIso) query = query.lt("created_at", beforeIso);
    const { data, error } = await query;
    if (error) throw new ValidationError("No se pudieron cargar los mensajes del chat.");
    // Se piden desc (los más nuevos) pero se devuelven asc para pintarlos en orden natural de conversación.
    return ((data ?? []) as IChatMessageRow[]).map(mapRow).reverse();
  }

  async insert(input: IInsertChatMessageInput): Promise<IChatMessage> {
    const { data, error } = await this.client
      .from("chat_messages")
      .insert({
        room: input.room,
        user_id: input.userId,
        nickname: input.nickname,
        content: input.content,
        kind: input.kind,
        metadata: input.metadata,
      })
      .select(CHAT_ROW_COLUMNS)
      .single<IChatMessageRow>();
    if (error || !data) throw new ValidationError("No se pudo enviar el mensaje.");
    return mapRow(data);
  }

  async softDeleteOwn(messageId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from("chat_messages")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", messageId)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .select("id");
    if (error) throw new ValidationError("No se pudo borrar el mensaje.");
    return (data?.length ?? 0) > 0;
  }

  async countRecentByUser(userId: string, sinceIso: string): Promise<number> {
    const { count, error } = await this.client
      .from("chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", sinceIso);
    if (error) throw new ValidationError("No se pudo verificar el ritmo de mensajes.");
    return count ?? 0;
  }

  async getReactionsForMessages(messageIds: string[], currentUserId: string): Promise<IChatMessageReactionSummary[]> {
    if (messageIds.length === 0) return [];
    const { data, error } = await this.client
      .from("chat_message_reactions")
      .select("message_id,user_id,emoji")
      .in("message_id", messageIds);
    if (error) throw new ValidationError("No se pudieron cargar las reacciones.");
    // Agregación por (mensaje, emoji): total y si el usuario actual reaccionó.
    const summaries = new Map<string, IChatMessageReactionSummary>();
    for (const row of (data ?? []) as IChatReactionRow[]) {
      const key = `${row.message_id}|${row.emoji}`;
      const existing = summaries.get(key) ?? { messageId: row.message_id, emoji: row.emoji, count: 0, reactedByMe: false };
      existing.count += 1;
      if (row.user_id === currentUserId) existing.reactedByMe = true;
      summaries.set(key, existing);
    }
    return [...summaries.values()];
  }

  async toggleReaction(messageId: string, userId: string, emoji: string): Promise<{ added: boolean }> {
    // Borrado-primero: si existía se quita (added=false); si no, se inserta (added=true).
    const removal = await this.client
      .from("chat_message_reactions")
      .delete()
      .eq("message_id", messageId)
      .eq("user_id", userId)
      .eq("emoji", emoji)
      .select("id");
    if (removal.error) throw new ValidationError("No se pudo actualizar la reacción.");
    if ((removal.data?.length ?? 0) > 0) return { added: false };
    const insertion = await this.client
      .from("chat_message_reactions")
      .insert({ message_id: messageId, user_id: userId, emoji });
    if (insertion.error) throw new ValidationError("No se pudo añadir la reacción.");
    return { added: true };
  }
}
