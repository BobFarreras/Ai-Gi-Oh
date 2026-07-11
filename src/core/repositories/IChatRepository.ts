// src/core/repositories/IChatRepository.ts - Puerto de persistencia del chat de comunidad.
import { ChatMessageKind, IChatMessage } from "@/core/entities/chat/IChatMessage";

export interface IInsertChatMessageInput {
  room: string;
  userId: string;
  nickname: string;
  content: string;
  kind: ChatMessageKind;
  metadata: Record<string, unknown>;
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
}
