// src/core/hooks/chat/community-chat-api.ts - Cliente HTTP del chat de comunidad.
import { ChatMessageKind, IChatMessage } from "@/core/entities/chat/IChatMessage";

async function parseError(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string; message?: string };
    return body.error ?? body.message ?? fallback;
  } catch {
    return fallback;
  }
}

export async function fetchRecentChatMessages(room: string, beforeIso?: string | null): Promise<IChatMessage[]> {
  const params = new URLSearchParams({ room });
  if (beforeIso) params.set("before", beforeIso);
  const response = await fetch(`/api/chat/messages?${params.toString()}`, { method: "GET", cache: "no-store" });
  if (!response.ok) throw new Error(await parseError(response, "No se pudieron cargar los mensajes."));
  const body = (await response.json()) as { messages: IChatMessage[] };
  return body.messages;
}

export async function sendChatMessage(input: {
  room: string;
  content: string;
  kind?: ChatMessageKind;
  metadata?: Record<string, unknown>;
}): Promise<IChatMessage> {
  const response = await fetch("/api/chat/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await parseError(response, "No se pudo enviar el mensaje."));
  const body = (await response.json()) as { message: IChatMessage };
  return body.message;
}

export async function deleteOwnChatMessage(messageId: string): Promise<void> {
  const response = await fetch(`/api/chat/messages/${messageId}`, { method: "DELETE" });
  if (!response.ok) throw new Error(await parseError(response, "No se pudo borrar el mensaje."));
}
