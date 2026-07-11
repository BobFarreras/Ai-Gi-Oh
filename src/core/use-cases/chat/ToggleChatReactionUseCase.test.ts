// src/core/use-cases/chat/ToggleChatReactionUseCase.test.ts - Verifica validación de emoji y delegación del toggle.
import { describe, expect, it, vi } from "vitest";
import { IChatRepository } from "@/core/repositories/IChatRepository";
import { ToggleChatReactionUseCase } from "@/core/use-cases/chat/ToggleChatReactionUseCase";

function createRepository(added: boolean): IChatRepository & { toggleReaction: ReturnType<typeof vi.fn> } {
  return {
    insert: vi.fn(),
    listRecent: vi.fn(async () => []),
    softDeleteOwn: vi.fn(async () => true),
    countRecentByUser: vi.fn(async () => 0),
    getReactionsForMessages: vi.fn(async () => []),
    toggleReaction: vi.fn(async () => ({ added })),
  };
}

describe("ToggleChatReactionUseCase", () => {
  it("alterna una reacción con emoji permitido", async () => {
    const repository = createRepository(true);
    const result = await new ToggleChatReactionUseCase(repository).execute({ messageId: "m1", userId: "u1", emoji: "🔥" });
    expect(result).toEqual({ added: true });
    expect(repository.toggleReaction).toHaveBeenCalledWith("m1", "u1", "🔥");
  });

  it("rechaza emojis fuera de la paleta", async () => {
    const repository = createRepository(true);
    await expect(new ToggleChatReactionUseCase(repository).execute({ messageId: "m1", userId: "u1", emoji: "💩" })).rejects.toThrow("no permitida");
    expect(repository.toggleReaction).not.toHaveBeenCalled();
  });

  it("rechaza sin messageId o userId", async () => {
    const repository = createRepository(true);
    await expect(new ToggleChatReactionUseCase(repository).execute({ messageId: "", userId: "u1", emoji: "🔥" })).rejects.toThrow();
  });
});
