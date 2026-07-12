// src/core/entities/chat/IDirectMessage.ts - Mensaje privado 1-a-1 y resumen de conversación (estilo WhatsApp).
export type DirectMessageKind = "TEXT" | "CARD_SHARE";

export interface IDirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  kind: DirectMessageKind;
  metadata: Record<string, unknown>;
  replyToMessageId: string | null;
  createdAtIso: string;
}

/** Resumen de una conversación privada para la lista de chats. */
export interface IDirectConversation {
  id: string;
  otherPlayerId: string;
  otherNickname: string;
  otherAvatarUrl: string | null;
  lastMessageAtIso: string;
  lastMessagePreview: string;
  unreadCount: number;
}
