// src/core/use-cases/chat/DeleteOwnChatMessageUseCase.ts - Borra (soft) un mensaje de chat propio.
import { IChatRepository } from "@/core/repositories/IChatRepository";
import { ValidationError } from "@/core/errors/ValidationError";

interface IDeleteOwnChatMessageInput {
  messageId: string;
  userId: string;
}

export class DeleteOwnChatMessageUseCase {
  constructor(private readonly repository: IChatRepository) {}

  /** Devuelve true si el mensaje era del usuario y se borró; false si no le pertenecía. */
  async execute(input: IDeleteOwnChatMessageInput): Promise<boolean> {
    if (!input.messageId.trim() || !input.userId.trim()) throw new ValidationError("Datos insuficientes para borrar el mensaje.");
    return this.repository.softDeleteOwn(input.messageId, input.userId);
  }
}
