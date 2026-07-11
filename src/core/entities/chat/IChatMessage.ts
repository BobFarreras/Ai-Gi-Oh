// src/core/entities/chat/IChatMessage.ts - Mensaje del chat/foro de comunidad.
export type ChatMessageKind = "TEXT" | "CARD_SHARE" | "SYSTEM";

export interface IChatMessage {
  id: string;
  room: string;
  userId: string;
  nickname: string;
  content: string;
  kind: ChatMessageKind;
  /** Datos extra según `kind` (p.ej. { cardId } para CARD_SHARE). Vacío en mensajes normales. */
  metadata: Record<string, unknown>;
  createdAtIso: string;
}
