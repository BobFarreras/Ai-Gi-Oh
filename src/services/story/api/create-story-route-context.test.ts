// src/services/story/api/create-story-route-context.test.ts - Valida contexto base Story autenticado para reutilizar frontera de seguridad y persistencia.
import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createStoryRouteContext } from "@/services/story/api/create-story-route-context";

const getAuthenticatedUserIdMock = vi.fn();
const createPlayerRouteRepositoriesMock = vi.fn();

vi.mock("@/services/auth/api/internal/get-authenticated-user-id", () => ({
  getAuthenticatedUserId: (...args: unknown[]) => getAuthenticatedUserIdMock(...args),
}));

vi.mock("@/services/player-persistence/create-player-route-repositories", () => ({
  createPlayerRouteRepositories: (...args: unknown[]) => createPlayerRouteRepositoriesMock(...args),
}));

describe("createStoryRouteContext", () => {
  it("devuelve playerId autenticado, repositorios y respuesta mutable", async () => {
    const repositories = { client: { id: "mock-client" } };
    createPlayerRouteRepositoriesMock.mockResolvedValueOnce(repositories);
    getAuthenticatedUserIdMock.mockResolvedValueOnce("player-1");
    const context = await createStoryRouteContext(new NextRequest("http://localhost:3000/api/story/world/move"));
    expect(context.playerId).toBe("player-1");
    expect(context.repositories).toBe(repositories);
    expect(context.response.headers).toBeDefined();
  });
});
