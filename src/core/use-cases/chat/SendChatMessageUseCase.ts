// src/core/use-cases/chat/SendChatMessageUseCase.ts - Valida y persiste un mensaje de chat de comunidad.
import { IChatMessage } from "@/core/entities/chat/IChatMessage";
import { IChatRepository } from "@/core/repositories/IChatRepository";
import { ValidationError } from "@/core/errors/ValidationError";
import { validateChatMessageInput } from "@/core/services/chat/validate-chat-message";

interface ISendChatMessageInput {
  userId: string;
  nickname: string;
  room?: string;
  content: string;
  kind?: string;
  metadata?: Record<string, unknown>;
  replyToMessageId?: string | null;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Solo se acepta un id de cita bien formado; cualquier otra cosa se descarta (la FK garantiza que exista). */
function sanitizeReplyToMessageId(value: string | null | undefined): string | null {
  return typeof value === "string" && UUID_PATTERN.test(value) ? value : null;
}

export class SendChatMessageUseCase {
  constructor(private readonly repository: IChatRepository) {}

  async execute(input: ISendChatMessageInput): Promise<IChatMessage> {
    if (!input.userId.trim()) throw new ValidationError("Sesión no válida para enviar al chat.");
    const validated = validateChatMessageInput({ room: input.room, content: input.content, kind: input.kind });
    return this.repository.insert({
      room: validated.room,
      userId: input.userId,
      nickname: input.nickname.trim() || "Operador",
      content: validated.content,
      kind: validated.kind,
      // Solo los mensajes no-TEXT llevan metadata (p.ej. CARD_SHARE → { cardId }).
      metadata: validated.kind === "TEXT" ? {} : (input.metadata ?? {}),
      replyToMessageId: sanitizeReplyToMessageId(input.replyToMessageId),
    });
  }
}
