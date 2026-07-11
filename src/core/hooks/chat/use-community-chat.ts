// src/core/hooks/chat/use-community-chat.ts - Estado + realtime del chat de comunidad (mensajes en vivo, envío y borrado).
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { ChatMessageKind, IChatMessage } from "@/core/entities/chat/IChatMessage";
import { createSupabaseBrowserClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-browser-client";
import { deleteOwnChatMessage, fetchRecentChatMessages, sendChatMessage } from "@/core/hooks/chat/community-chat-api";

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

/** Añade un mensaje evitando duplicados (el INSERT realtime puede llegar tras el envío optimista). */
function appendUnique(messages: IChatMessage[], incoming: IChatMessage): IChatMessage[] {
  if (messages.some((message) => message.id === incoming.id)) return messages;
  return [...messages, incoming];
}

export interface IUseCommunityChatResult {
  messages: IChatMessage[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  send: (input: { content: string; kind?: ChatMessageKind; metadata?: Record<string, unknown> }) => Promise<boolean>;
  remove: (messageId: string) => Promise<void>;
  clearError: () => void;
}

/**
 * Chat en vivo de una sala: carga inicial por API + suscripción realtime. Los mensajes nuevos llegan por
 * `postgres_changes` (INSERT); los borrados se propagan por `broadcast` (el soft-delete deja de ser visible
 * por RLS, así que el evento de UPDATE no llegaría a los demás suscriptores).
 */
export function useCommunityChat(room: string, initialMessages: IChatMessage[] = []): IUseCommunityChatResult {
  const [messages, setMessages] = useState<IChatMessage[]>(initialMessages);
  // Si el server ya trajo mensajes, no volvemos a cargar (evita el flash); si no, cargamos por API.
  const [isLoading, setIsLoading] = useState(initialMessages.length === 0);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const hasInitialRef = useRef(initialMessages.length > 0);

  useEffect(() => {
    let isActive = true;
    const supabase = createSupabaseBrowserClient();
    const channel = supabase.channel(`chat:${room}`, { config: { broadcast: { self: false } } });
    channelRef.current = channel;

    if (!hasInitialRef.current) {
      void fetchRecentChatMessages(room)
        .then((initial) => {
          if (isActive) setMessages(initial);
        })
        .catch((loadError: unknown) => {
          if (isActive) setError(loadError instanceof Error ? loadError.message : "No se pudo cargar el chat.");
        })
        .finally(() => {
          if (isActive) setIsLoading(false);
        });
    }

    channel
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `room=eq.${room}` }, (payload) => {
        setMessages((current) => appendUnique(current, mapRow(payload.new as IChatMessageRow)));
      })
      .on("broadcast", { event: "message_deleted" }, ({ payload }) => {
        const deletedId = (payload as { id?: string })?.id;
        if (deletedId) setMessages((current) => current.filter((message) => message.id !== deletedId));
      })
      .subscribe();

    return () => {
      isActive = false;
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [room]);

  const send = useCallback(
    async (input: { content: string; kind?: ChatMessageKind; metadata?: Record<string, unknown> }): Promise<boolean> => {
      if (isSending) return false;
      setIsSending(true);
      setError(null);
      try {
        const created = await sendChatMessage({ room, content: input.content, kind: input.kind, metadata: input.metadata });
        // Optimista: se añade ya (dedup por id cuando llegue el INSERT realtime).
        setMessages((current) => appendUnique(current, created));
        return true;
      } catch (sendError) {
        setError(sendError instanceof Error ? sendError.message : "No se pudo enviar el mensaje.");
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [isSending, room],
  );

  const remove = useCallback(async (messageId: string): Promise<void> => {
    try {
      await deleteOwnChatMessage(messageId);
      setMessages((current) => current.filter((message) => message.id !== messageId));
      channelRef.current?.send({ type: "broadcast", event: "message_deleted", payload: { id: messageId } });
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "No se pudo borrar el mensaje.");
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { messages, isLoading, isSending, error, send, remove, clearError };
}
