// src/core/use-cases/chat/SendDirectMessageUseCase.ts - Valida y persiste un mensaje privado 1-a-1.
import { DirectMessageKind, IDirectMessage } from "@/core/entities/chat/IDirectMessage";
import { IDirectMessageRepository } from "@/core/repositories/IDirectMessageRepository";
import { ValidationError } from "@/core/errors/ValidationError";
import { CHAT_MESSAGE_MAX_LENGTH } from "@/core/services/chat/validate-chat-message";

interface ISendDirectMessageInput {
  senderId: string;
  conversationId: string;
  content: string;
  kind?: string;
  metadata?: Record<string, unknown>;
  replyToMessageId?: string | null;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function sanitizeReplyToMessageId(value: string | null | undefined): string | null {
  return typeof value === "string" && UUID_PATTERN.test(value) ? value : null;
}

function normalizeKind(kind: string | undefined): DirectMessageKind {
  return kind === "CARD_SHARE" ? "CARD_SHARE" : "TEXT";
}

export class SendDirectMessageUseCase {
  constructor(private readonly repository: IDirectMessageRepository) {}

  async execute(input: ISendDirectMessageInput): Promise<IDirectMessage> {
    if (!input.senderId.trim()) throw new ValidationError("Sesión no válida para enviar el mensaje.");
    if (!UUID_PATTERN.test(input.conversationId)) throw new ValidationError("Conversación no válida.");
    if (typeof input.content !== "string") throw new ValidationError("El mensaje es obligatorio.");
    const content = input.content.trim();
    if (content.length === 0) throw new ValidationError("El mensaje no puede estar vacío.");
    if (content.length > CHAT_MESSAGE_MAX_LENGTH) {
      throw new ValidationError(`El mensaje no puede superar ${CHAT_MESSAGE_MAX_LENGTH} caracteres.`);
    }
    // Frontera de seguridad: solo un participante puede escribir en la conversación.
    if (!(await this.repository.isParticipant(input.conversationId, input.senderId))) {
      throw new ValidationError("No participas en esta conversación.");
    }
    const kind = normalizeKind(input.kind);
    return this.repository.insert({
      conversationId: input.conversationId,
      senderId: input.senderId,
      content,
      kind,
      metadata: kind === "TEXT" ? {} : (input.metadata ?? {}),
      replyToMessageId: sanitizeReplyToMessageId(input.replyToMessageId),
    });
  }
}
