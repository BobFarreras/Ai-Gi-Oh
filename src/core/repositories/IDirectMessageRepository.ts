// src/core/repositories/IDirectMessageRepository.ts - Puerto de persistencia de los mensajes privados 1-a-1.
import { DirectMessageKind, IDirectConversation, IDirectMessage } from "@/core/entities/chat/IDirectMessage";

export interface IInsertDirectMessageInput {
  conversationId: string;
  senderId: string;
  content: string;
  kind: DirectMessageKind;
  metadata: Record<string, unknown>;
  replyToMessageId: string | null;
}

export interface IDirectMessageRepository {
  /** Abre (o recupera) la conversación entre el jugador y otro; devuelve su id. */
  getOrCreateConversation(playerId: string, otherPlayerId: string): Promise<string>;
  /** Conversaciones del jugador con último mensaje + no-leídos, de la más reciente a la más antigua. */
  listConversations(playerId: string): Promise<IDirectConversation[]>;
  /** true si el jugador es uno de los dos participantes de la conversación. */
  isParticipant(conversationId: string, playerId: string): Promise<boolean>;
  /** Mensajes NO borrados de una conversación, del más antiguo al más nuevo. `beforeIso` pagina hacia atrás. */
  listMessages(conversationId: string, limit: number, beforeIso?: string | null): Promise<IDirectMessage[]>;
  /** Inserta un mensaje, actualiza `last_message_at` y devuelve el creado. */
  insert(input: IInsertDirectMessageInput): Promise<IDirectMessage>;
  /** Marca la conversación como leída por el jugador (actualiza su *_read_at). */
  markRead(conversationId: string, playerId: string): Promise<void>;
  /** Cuántos mensajes ha enviado el jugador desde `sinceIso` (rate limit anti-spam). */
  countRecentBySender(senderId: string, sinceIso: string): Promise<number>;
  /** Marca como borrado un mensaje SOLO si pertenece al jugador. Devuelve true si se borró. */
  softDeleteOwn(messageId: string, senderId: string): Promise<boolean>;
}
