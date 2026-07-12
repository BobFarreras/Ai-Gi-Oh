// src/core/hooks/chat/use-direct-conversation.ts - Estado + realtime de una conversación privada 1-a-1.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { DirectMessageKind, IDirectMessage } from "@/core/entities/chat/IDirectMessage";
import { createSupabaseBrowserClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-browser-client";
import {
  deleteOwnDirectMessage,
  markDirectConversationRead,
  sendDirectMessage,
} from "@/core/hooks/chat/direct-messages-api";

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

function mapRow(row: IDmMessageRow): IDirectMessage {
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

function appendUnique(messages: IDirectMessage[], incoming: IDirectMessage): IDirectMessage[] {
  if (messages.some((message) => message.id === incoming.id)) return messages;
  return [...messages, incoming];
}

export interface IUseDirectConversationResult {
  messages: IDirectMessage[];
  isSending: boolean;
  error: string | null;
  send: (input: { content: string; kind?: DirectMessageKind; metadata?: Record<string, unknown>; replyToMessageId?: string | null }) => Promise<boolean>;
  remove: (messageId: string) => Promise<void>;
  clearError: () => void;
}

export function useDirectConversation(
  conversationId: string,
  initialMessages: IDirectMessage[] = [],
): IUseDirectConversationResult {
  const [messages, setMessages] = useState<IDirectMessage[]>(initialMessages);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase.channel(`dm:${conversationId}`, { config: { broadcast: { self: false } } });
    channelRef.current = channel;
    channel
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "dm_messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const incoming = mapRow(payload.new as IDmMessageRow);
          setMessages((current) => appendUnique(current, incoming));
          // Un mensaje entrante mientras la conversación está abierta se marca como leído.
          void markDirectConversationRead(conversationId);
        },
      )
      .on("broadcast", { event: "message_deleted" }, ({ payload }) => {
        const deletedId = (payload as { id?: string })?.id;
        if (deletedId) setMessages((current) => current.filter((message) => message.id !== deletedId));
      })
      .subscribe();

    return () => {
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const send = useCallback(
    async (input: { content: string; kind?: DirectMessageKind; metadata?: Record<string, unknown>; replyToMessageId?: string | null }): Promise<boolean> => {
      if (isSending) return false;
      setIsSending(true);
      setError(null);
      try {
        const created = await sendDirectMessage({ conversationId, ...input });
        setMessages((current) => appendUnique(current, created));
        return true;
      } catch (sendError) {
        setError(sendError instanceof Error ? sendError.message : "No se pudo enviar el mensaje.");
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [conversationId, isSending],
  );

  const remove = useCallback(async (messageId: string): Promise<void> => {
    try {
      await deleteOwnDirectMessage(messageId);
      setMessages((current) => current.filter((message) => message.id !== messageId));
      channelRef.current?.send({ type: "broadcast", event: "message_deleted", payload: { id: messageId } });
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "No se pudo borrar el mensaje.");
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { messages, isSending, error, send, remove, clearError };
}
