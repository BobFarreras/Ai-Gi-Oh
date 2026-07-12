// src/core/repositories/IChatRepository.ts - Puerto de persistencia del chat de comunidad.
import { ChatMessageKind, IChatMessage } from "@/core/entities/chat/IChatMessage";
import { IChatMessageReactionSummary } from "@/core/entities/chat/IChatMessageReaction";

export interface IInsertChatMessageInput {
  room: string;
  userId: string;
  nickname: string;
  content: string;
  kind: ChatMessageKind;
  metadata: Record<string, unknown>;
  /** Id del mensaje citado al responder, o null. */
  replyToMessageId: string | null;
}

export interface IChatRepository {
  /** Últimos mensajes NO borrados de una sala, del más nuevo al más antiguo. `beforeIso` pagina hacia atrás. */
  listRecent(room: string, limit: number, beforeIso?: string | null): Promise<IChatMessage[]>;
  /** Inserta un mensaje y devuelve el creado (para difundirlo/optimista). */
  insert(input: IInsertChatMessageInput): Promise<IChatMessage>;
  /** Marca como borrado un mensaje SOLO si pertenece al usuario. Devuelve true si se borró. */
  softDeleteOwn(messageId: string, userId: string): Promise<boolean>;
  /** Cuántos mensajes ha enviado el usuario desde `sinceIso` (para rate limit anti-spam). */
  countRecentByUser(userId: string, sinceIso: string): Promise<number>;
  /** Reacciones agregadas (emoji + total + si el usuario reaccionó) de los mensajes indicados. */
  getReactionsForMessages(messageIds: string[], currentUserId: string): Promise<IChatMessageReactionSummary[]>;
  /** Alterna una reacción del usuario a un mensaje: la añade si no estaba, la quita si estaba. */
  toggleReaction(messageId: string, userId: string, emoji: string): Promise<{ added: boolean }>;
}
