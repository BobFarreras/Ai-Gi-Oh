// src/core/hooks/chat/use-community-chat.ts - Estado + realtime del chat de comunidad (mensajes, reacciones, envío y borrado).
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { ChatMessageKind, IChatMessage } from "@/core/entities/chat/IChatMessage";
import { IChatMessageReactionSummary } from "@/core/entities/chat/IChatMessageReaction";
import { createSupabaseBrowserClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-browser-client";
import { deleteOwnChatMessage, fetchRecentChatMessages, sendChatMessage, toggleChatReaction } from "@/core/hooks/chat/community-chat-api";

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

interface IReactionBroadcast {
  messageId: string;
  emoji: string;
  added: boolean;
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

/** Aplica un cambio de reacción al estado agregado. `isMine` solo afecta a `reactedByMe`. */
function applyReactionDelta(
  reactions: IChatMessageReactionSummary[],
  messageId: string,
  emoji: string,
  added: boolean,
  isMine: boolean,
): IChatMessageReactionSummary[] {
  const index = reactions.findIndex((reaction) => reaction.messageId === messageId && reaction.emoji === emoji);
  if (index === -1) {
    if (!added) return reactions;
    return [...reactions, { messageId, emoji, count: 1, reactedByMe: isMine }];
  }
  const current = reactions[index];
  const nextCount = current.count + (added ? 1 : -1);
  const reactedByMe = isMine ? added : current.reactedByMe;
  if (nextCount <= 0) return reactions.filter((_, position) => position !== index);
  return reactions.map((reaction, position) => (position === index ? { ...current, count: nextCount, reactedByMe } : reaction));
}

export interface IUseCommunityChatResult {
  messages: IChatMessage[];
  reactions: IChatMessageReactionSummary[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  send: (input: { content: string; kind?: ChatMessageKind; metadata?: Record<string, unknown> }) => Promise<boolean>;
  remove: (messageId: string) => Promise<void>;
  toggleReaction: (messageId: string, emoji: string) => Promise<void>;
  clearError: () => void;
}

export function useCommunityChat(
  room: string,
  initialMessages: IChatMessage[] = [],
  initialReactions: IChatMessageReactionSummary[] = [],
): IUseCommunityChatResult {
  const [messages, setMessages] = useState<IChatMessage[]>(initialMessages);
  const [reactions, setReactions] = useState<IChatMessageReactionSummary[]>(initialReactions);
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
          if (!isActive) return;
          setMessages(initial.messages);
          setReactions(initial.reactions);
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
        if (!deletedId) return;
        setMessages((current) => current.filter((message) => message.id !== deletedId));
        setReactions((current) => current.filter((reaction) => reaction.messageId !== deletedId));
      })
      .on("broadcast", { event: "reaction" }, ({ payload }) => {
        const data = payload as IReactionBroadcast;
        if (!data?.messageId || !data.emoji) return;
        setReactions((current) => applyReactionDelta(current, data.messageId, data.emoji, data.added, false));
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
      setReactions((current) => current.filter((reaction) => reaction.messageId !== messageId));
      channelRef.current?.send({ type: "broadcast", event: "message_deleted", payload: { id: messageId } });
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "No se pudo borrar el mensaje.");
    }
  }, []);

  const toggleReaction = useCallback(async (messageId: string, emoji: string): Promise<void> => {
    // Optimista: alterna según el estado propio actual; el servidor confirma y se difunde a los demás.
    const currentlyMine = reactions.some((reaction) => reaction.messageId === messageId && reaction.emoji === emoji && reaction.reactedByMe);
    const optimisticAdded = !currentlyMine;
    setReactions((current) => applyReactionDelta(current, messageId, emoji, optimisticAdded, true));
    try {
      const result = await toggleChatReaction(messageId, emoji);
      // Si el servidor discrepa (carrera), reconcilia aplicando la diferencia.
      if (result.added !== optimisticAdded) {
        setReactions((current) => applyReactionDelta(current, messageId, emoji, result.added, true));
      }
      channelRef.current?.send({ type: "broadcast", event: "reaction", payload: { messageId, emoji, added: result.added } });
    } catch {
      // Revierte el optimismo ante error.
      setReactions((current) => applyReactionDelta(current, messageId, emoji, !optimisticAdded, true));
    }
  }, [reactions]);

  const clearError = useCallback(() => setError(null), []);

  return { messages, reactions, isLoading, isSending, error, send, remove, toggleReaction, clearError };
}
