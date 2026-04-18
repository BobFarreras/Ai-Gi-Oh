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

  it("usa SUPABASE_SERVICE_ROLE_KEY como fallback seguro en producción", () => {
    const env = process.env as Record<string, string | undefined>;
    const originalNodeEnv = process.env.NODE_ENV;
    const originalDuelSecret = process.env.DUEL_COMPLETION_TOKEN_SECRET;
    const originalServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
    try {
      env.NODE_ENV = "production";
      delete env.DUEL_COMPLETION_TOKEN_SECRET;
      env.SUPABASE_SERVICE_ROLE_KEY = "service-role-fallback-secret";
      const ticket = issueTrainingCompletionTicket({ playerId: "player-1", tier: 1, battleId: "battle-fallback" });
      expect(verifyTrainingCompletionTicket(ticket, "player-1")).toEqual({ tier: 1, battleId: "battle-fallback" });
    } finally {
      env.NODE_ENV = originalNodeEnv;
      if (originalDuelSecret === undefined) delete env.DUEL_COMPLETION_TOKEN_SECRET;
      else env.DUEL_COMPLETION_TOKEN_SECRET = originalDuelSecret;
      if (originalServiceRole === undefined) delete env.SUPABASE_SERVICE_ROLE_KEY;
      else env.SUPABASE_SERVICE_ROLE_KEY = originalServiceRole;
    }
  });
});
