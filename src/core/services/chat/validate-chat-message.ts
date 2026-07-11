// src/core/services/chat/validate-chat-message.ts - Reglas de validación puras para enviar un mensaje de chat.
import { ChatMessageKind } from "@/core/entities/chat/IChatMessage";
import { ValidationError } from "@/core/errors/ValidationError";

export const CHAT_MESSAGE_MAX_LENGTH = 500;
export const CHAT_ROOM_MAX_LENGTH = 40;
const VALID_KINDS: ReadonlySet<ChatMessageKind> = new Set(["TEXT", "CARD_SHARE", "SYSTEM"]);

export interface IValidatedChatMessage {
  room: string;
  content: string;
  kind: ChatMessageKind;
}

/** Normaliza y valida el contenido de un mensaje de chat (recorta, comprueba longitud y sala). */
export function validateChatMessageInput(input: { room?: unknown; content?: unknown; kind?: unknown }): IValidatedChatMessage {
  const room = typeof input.room === "string" && input.room.trim() ? input.room.trim() : "lobby";
  if (room.length > CHAT_ROOM_MAX_LENGTH) throw new ValidationError("La sala del chat no es válida.");
  if (typeof input.content !== "string") throw new ValidationError("El mensaje es obligatorio.");
  const content = input.content.replace(/\s+$/g, "").replace(/^\s+/g, "");
  if (content.length === 0) throw new ValidationError("El mensaje no puede estar vacío.");
  if (content.length > CHAT_MESSAGE_MAX_LENGTH) throw new ValidationError(`El mensaje no puede superar ${CHAT_MESSAGE_MAX_LENGTH} caracteres.`);
  const kind: ChatMessageKind = typeof input.kind === "string" && VALID_KINDS.has(input.kind as ChatMessageKind)
    ? (input.kind as ChatMessageKind)
    : "TEXT";
  return { room, content, kind };
}
