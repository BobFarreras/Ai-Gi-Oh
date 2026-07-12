// src/core/hooks/chat/direct-messages-api.ts - Cliente HTTP de los mensajes privados 1-a-1.
import { DirectMessageKind, IDirectConversation, IDirectMessage } from "@/core/entities/chat/IDirectMessage";

async function parseError(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string; message?: string };
    return body.error ?? body.message ?? fallback;
  } catch {
    return fallback;
  }
}

export async function fetchDirectConversations(): Promise<IDirectConversation[]> {
  const response = await fetch("/api/chat/dm/conversations", { method: "GET", cache: "no-store" });
  if (!response.ok) throw new Error(await parseError(response, "No se pudieron cargar las conversaciones."));
  const body = (await response.json()) as { conversations: IDirectConversation[] };
  return body.conversations ?? [];
}

export async function openDirectConversation(otherPlayerId: string): Promise<string> {
  const response = await fetch("/api/chat/dm/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ otherPlayerId }),
  });
  if (!response.ok) throw new Error(await parseError(response, "No se pudo abrir la conversación."));
  const body = (await response.json()) as { conversationId: string };
  return body.conversationId;
}

export async function fetchDirectMessages(conversationId: string, beforeIso?: string | null): Promise<IDirectMessage[]> {
  const params = new URLSearchParams({ conversationId });
  if (beforeIso) params.set("before", beforeIso);
  const response = await fetch(`/api/chat/dm/messages?${params.toString()}`, { method: "GET", cache: "no-store" });
  if (!response.ok) throw new Error(await parseError(response, "No se pudieron cargar los mensajes."));
  const body = (await response.json()) as { messages: IDirectMessage[] };
  return body.messages ?? [];
}

export async function sendDirectMessage(input: {
  conversationId: string;
  content: string;
  kind?: DirectMessageKind;
  metadata?: Record<string, unknown>;
  replyToMessageId?: string | null;
}): Promise<IDirectMessage> {
  const response = await fetch("/api/chat/dm/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await parseError(response, "No se pudo enviar el mensaje."));
  const body = (await response.json()) as { message: IDirectMessage };
  return body.message;
}

export async function deleteOwnDirectMessage(messageId: string): Promise<void> {
  const response = await fetch(`/api/chat/dm/messages/${messageId}`, { method: "DELETE" });
  if (!response.ok) throw new Error(await parseError(response, "No se pudo borrar el mensaje."));
}

export async function fetchUnreadDirectCount(): Promise<number> {
  const response = await fetch("/api/chat/dm/unread", { method: "GET", cache: "no-store" });
  if (!response.ok) return 0;
  const body = (await response.json()) as { count?: number };
  return body.count ?? 0;
}

export async function markDirectConversationRead(conversationId: string): Promise<void> {
  await fetch("/api/chat/dm/read", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversationId }),
  }).catch(() => undefined);
}
