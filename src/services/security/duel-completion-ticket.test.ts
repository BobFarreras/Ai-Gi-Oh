// src/services/security/duel-completion-ticket.test.ts - Verifica emisión/validación de tickets firmados para cierres de duelo Story/Training.
import { describe, expect, it, vi } from "vitest";
import {
  issueStoryCompletionTicket,
  issueTrainingCompletionTicket,
  verifyStoryCompletionTicket,
  verifyTrainingCompletionTicket,
} from "@/services/security/duel-completion-ticket";

describe("duel-completion-ticket", () => {
  it("valida ticket Training para el jugador correcto", () => {
    const ticket = issueTrainingCompletionTicket({ playerId: "player-1", tier: 2, battleId: "battle-abc" });
    expect(verifyTrainingCompletionTicket(ticket, "player-1")).toEqual({ tier: 2, battleId: "battle-abc" });
  });

  it("rechaza ticket Story cuando pertenece a otro jugador", () => {
    const ticket = issueStoryCompletionTicket({ playerId: "player-1", chapter: 1, duelIndex: 3 });
    expect(() => verifyStoryCompletionTicket(ticket, "player-2")).toThrow("no pertenece");
  });

  it("rechaza ticket expirado", () => {
    vi.useFakeTimers();
    const now = new Date("2026-04-17T10:00:00.000Z");
    vi.setSystemTime(now);
    const ticket = issueStoryCompletionTicket({ playerId: "player-1", chapter: 1, duelIndex: 1, ttlMs: 1000 });
    vi.setSystemTime(new Date(now.getTime() + 2000));
    expect(() => verifyStoryCompletionTicket(ticket, "player-1")).toThrow("expirado");
    vi.useRealTimers();
  });
});
