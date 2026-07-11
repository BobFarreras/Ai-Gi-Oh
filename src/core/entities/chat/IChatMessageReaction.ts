// src/core/entities/chat/IChatMessageReaction.ts - Resumen de reacciones (emoji) agregadas por mensaje.
export interface IChatMessageReactionSummary {
  messageId: string;
  emoji: string;
  count: number;
  /** Si el usuario actual ha reaccionado con este emoji (para resaltar y alternar). */
  reactedByMe: boolean;
}
