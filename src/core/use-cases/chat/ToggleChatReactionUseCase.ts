// src/core/use-cases/chat/ToggleChatReactionUseCase.ts - Alterna una reacción (emoji) del usuario a un mensaje.
import { IChatRepository } from "@/core/repositories/IChatRepository";
import { ValidationError } from "@/core/errors/ValidationError";
import { assertValidReactionEmoji } from "@/core/services/chat/chat-reactions";

interface IToggleChatReactionInput {
  messageId: string;
  userId: string;
  emoji: string;
}

export class ToggleChatReactionUseCase {
  constructor(private readonly repository: IChatRepository) {}

  async execute(input: IToggleChatReactionInput): Promise<{ added: boolean }> {
    if (!input.messageId.trim() || !input.userId.trim()) throw new ValidationError("Datos insuficientes para reaccionar.");
    const emoji = assertValidReactionEmoji(input.emoji);
    return this.repository.toggleReaction(input.messageId, input.userId, emoji);
  }
}
