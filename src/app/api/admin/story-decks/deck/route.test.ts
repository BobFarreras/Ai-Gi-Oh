// src/app/api/admin/story-decks/deck/route.test.ts - Valida lectura y guardado de Story Deck admin con rate-limit y auditoría.
import { describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { AuthorizationError } from "@/core/errors/AuthorizationError";
import { GET, POST } from "@/app/api/admin/story-decks/deck/route";

const requireTrustedMutationOriginMock = vi.fn();
const createAdminStoryDeckContextMock = vi.fn();
const readAdminSaveStoryDeckCommandMock = vi.fn();
const consumeAdminMutationRateLimitMock = vi.fn();

vi.mock("@/services/security/api/require-trusted-mutation-origin", () => ({
  requireTrustedMutationOrigin: (...args: unknown[]) => requireTrustedMutationOriginMock(...args),
}));
vi.mock("@/services/admin/api/create-admin-story-deck-context", () => ({
  createAdminStoryDeckContext: (...args: unknown[]) => createAdminStoryDeckContextMock(...args),
}));
vi.mock("@/services/admin/api/read-admin-story-deck-command", () => ({
  readAdminSaveStoryDeckCommand: (...args: unknown[]) => readAdminSaveStoryDeckCommandMock(...args),
}));
vi.mock("@/services/admin/api/security/admin-rate-limiter", () => ({
  consumeAdminMutationRateLimit: (...args: unknown[]) => consumeAdminMutationRateLimitMock(...args),
}));

describe("story decks admin route", () => {
  it("GET responde datos de deck + cartas disponibles", async () => {
    createAdminStoryDeckContextMock.mockResolvedValueOnce({
      response: NextResponse.json({ ok: true }),
      getDataUseCase: { execute: vi.fn(async () => ({ selectedDeck: null })) },
      repository: { listAvailableCards: vi.fn(async () => [{ id: "entity-react" }]) },
    });
    const request = new NextRequest("http://localhost:3000/api/admin/story-decks/deck?opponentId=gemnvim", { method: "GET" });
    const response = await GET(request);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ selectedDeck: null, availableCards: [{ id: "entity-react" }] });
  });

  it("POST persiste cambios y audita el deck", async () => {
    requireTrustedMutationOriginMock.mockReturnValueOnce(null);
    readAdminSaveStoryDeckCommandMock.mockResolvedValueOnce({ deckListId: "story-deck-1", cardIds: ["entity-react"], duelConfig: null, updateBaseDeck: true });
    const saveDeckUseCase = { execute: vi.fn(async () => undefined) };
    const writeAuditLogUseCase = { execute: vi.fn(async () => undefined) };
    createAdminStoryDeckContextMock.mockResolvedValueOnce({
      profile: { userId: "admin-1" },
      response: NextResponse.json({ ok: true }),
      saveDeckUseCase,
      writeAuditLogUseCase,
    });
    consumeAdminMutationRateLimitMock.mockResolvedValueOnce(true);
    const request = new NextRequest("http://localhost:3000/api/admin/story-decks/deck", { method: "POST" });
    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(saveDeckUseCase.execute).toHaveBeenCalledTimes(1);
    expect(writeAuditLogUseCase.execute).toHaveBeenCalledTimes(1);
  });

  it("GET devuelve 403 cuando el usuario no es admin", async () => {
    createAdminStoryDeckContextMock.mockRejectedValueOnce(new AuthorizationError("No autorizado"));
    const request = new NextRequest("http://localhost:3000/api/admin/story-decks/deck", { method: "GET" });
    const response = await GET(request);
    expect(response.status).toBe(403);
  });

  it("POST devuelve 403 cuando el usuario no es admin", async () => {
    requireTrustedMutationOriginMock.mockReturnValueOnce(null);
    createAdminStoryDeckContextMock.mockRejectedValueOnce(new AuthorizationError("No autorizado"));
    const request = new NextRequest("http://localhost:3000/api/admin/story-decks/deck", { method: "POST" });
    const response = await POST(request);
    expect(response.status).toBe(403);
  });
});
