// src/core/use-cases/chat/SendChatMessageUseCase.test.ts - Verifica validación y persistencia del envío de mensajes.
import { describe, expect, it, vi } from "vitest";
import { IChatMessage } from "@/core/entities/chat/IChatMessage";
import { IChatRepository, IInsertChatMessageInput } from "@/core/repositories/IChatRepository";
import { SendChatMessageUseCase } from "@/core/use-cases/chat/SendChatMessageUseCase";

function createRepository(): IChatRepository & { insert: ReturnType<typeof vi.fn> } {
  const insert = vi.fn(async (input: IInsertChatMessageInput): Promise<IChatMessage> => ({
    id: "msg-1",
    room: input.room,
    userId: input.userId,
    nickname: input.nickname,
    content: input.content,
    kind: input.kind,
    metadata: input.metadata,
    replyToMessageId: input.replyToMessageId,
    createdAtIso: "2026-07-11T00:00:00.000Z",
  }));
  return {
    insert,
    listRecent: vi.fn(async () => []),
    softDeleteOwn: vi.fn(async () => true),
    countRecentByUser: vi.fn(async () => 0),
    getReactionsForMessages: vi.fn(async () => []),
    toggleReaction: vi.fn(async () => ({ added: true })),
  };
}

describe("SendChatMessageUseCase", () => {
  it("valida, recorta y persiste el mensaje", async () => {
    const repository = createRepository();
    const message = await new SendChatMessageUseCase(repository).execute({
      userId: "user-1",
      nickname: "  Bob  ",
      content: "  gg wp  ",
    });
    expect(repository.insert).toHaveBeenCalledWith(
      expect.objectContaining({ room: "lobby", userId: "user-1", nickname: "Bob", content: "gg wp", kind: "TEXT", metadata: {} }),
    );
    expect(message.id).toBe("msg-1");
  });

  it("descarta metadata en mensajes de TEXTO y la conserva en CARD_SHARE", async () => {
    const repository = createRepository();
    await new SendChatMessageUseCase(repository).execute({ userId: "u", nickname: "n", content: "hola", metadata: { cardId: "x" } });
    expect(repository.insert).toHaveBeenLastCalledWith(expect.objectContaining({ metadata: {} }));
    await new SendChatMessageUseCase(repository).execute({ userId: "u", nickname: "n", content: "mira", kind: "CARD_SHARE", metadata: { cardId: "entity-kali" } });
    expect(repository.insert).toHaveBeenLastCalledWith(expect.objectContaining({ kind: "CARD_SHARE", metadata: { cardId: "entity-kali" } }));
  });

  it("conserva un id de cita válido (UUID) y descarta uno malformado", async () => {
    const repository = createRepository();
    const validId = "11111111-2222-4333-8444-555555555555";
    await new SendChatMessageUseCase(repository).execute({ userId: "u", nickname: "n", content: "respondo", replyToMessageId: validId });
    expect(repository.insert).toHaveBeenLastCalledWith(expect.objectContaining({ replyToMessageId: validId }));
    await new SendChatMessageUseCase(repository).execute({ userId: "u", nickname: "n", content: "sin cita", replyToMessageId: "no-es-uuid" });
    expect(repository.insert).toHaveBeenLastCalledWith(expect.objectContaining({ replyToMessageId: null }));
  });

  it("rechaza sin userId o con contenido vacío", async () => {
    const repository = createRepository();
    await expect(new SendChatMessageUseCase(repository).execute({ userId: "", nickname: "n", content: "hola" })).rejects.toThrow();
    await expect(new SendChatMessageUseCase(repository).execute({ userId: "u", nickname: "n", content: "   " })).rejects.toThrow();
  });
});
