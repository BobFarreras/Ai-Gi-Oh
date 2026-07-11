// src/core/use-cases/chat/GetRecentChatMessagesUseCase.ts - Lee los mensajes recientes de una sala del chat (paginable).
import { IChatMessage } from "@/core/entities/chat/IChatMessage";
import { IChatRepository } from "@/core/repositories/IChatRepository";

export const CHAT_PAGE_SIZE = 50;
const CHAT_MAX_PAGE_SIZE = 100;

interface IGetRecentChatMessagesInput {
  room?: string;
  beforeIso?: string | null;
  limit?: number;
}

function clampLimit(limit: number | undefined): number {
  if (typeof limit !== "number" || !Number.isFinite(limit)) return CHAT_PAGE_SIZE;
  return Math.max(1, Math.min(CHAT_MAX_PAGE_SIZE, Math.trunc(limit)));
}

export class GetRecentChatMessagesUseCase {
  constructor(private readonly repository: IChatRepository) {}

  async execute(input: IGetRecentChatMessagesInput = {}): Promise<IChatMessage[]> {
    const room = input.room?.trim() || "lobby";
    return this.repository.listRecent(room, clampLimit(input.limit), input.beforeIso ?? null);
  }
}
