// src/app/api/admin/starter-deck/template/route.test.ts - Verifica lectura/guardado starter admin con controles de seguridad y auditoría.
import { describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { AuthorizationError } from "@/core/errors/AuthorizationError";
import { GET, POST } from "@/app/api/admin/starter-deck/template/route";

const requireTrustedMutationOriginMock = vi.fn();
const createAdminStarterDeckContextMock = vi.fn();
const readAdminSaveStarterDeckTemplateCommandMock = vi.fn();
const consumeAdminMutationRateLimitMock = vi.fn();

vi.mock("@/services/security/api/require-trusted-mutation-origin", () => ({
  requireTrustedMutationOrigin: (...args: unknown[]) => requireTrustedMutationOriginMock(...args),
}));
vi.mock("@/services/admin/api/create-admin-starter-deck-context", () => ({
  createAdminStarterDeckContext: (...args: unknown[]) => createAdminStarterDeckContextMock(...args),
}));
vi.mock("@/services/admin/api/read-admin-starter-deck-command", () => ({
  readAdminSaveStarterDeckTemplateCommand: (...args: unknown[]) => readAdminSaveStarterDeckTemplateCommandMock(...args),
}));
vi.mock("@/services/admin/api/security/admin-rate-limiter", () => ({
  consumeAdminMutationRateLimit: (...args: unknown[]) => consumeAdminMutationRateLimitMock(...args),
}));

describe("starter deck admin route", () => {
  it("GET devuelve plantilla y cartas disponibles", async () => {
    createAdminStarterDeckContextMock.mockResolvedValueOnce({
      response: NextResponse.json({ ok: true }),
      getTemplateUseCase: { execute: vi.fn(async () => ({ template: null })) },
      repository: { listAvailableCards: vi.fn(async () => [{ id: "entity-vscode" }]) },
    });
    const request = new NextRequest("http://localhost:3000/api/admin/starter-deck/template?templateKey=academy", { method: "GET" });
    const response = await GET(request);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ template: null, availableCards: [{ id: "entity-vscode" }] });
  });

  it("POST guarda plantilla y audita cuando cumple seguridad", async () => {
    requireTrustedMutationOriginMock.mockReturnValueOnce(null);
    readAdminSaveStarterDeckTemplateCommandMock.mockResolvedValueOnce({ templateKey: "academy", cardIds: ["entity-vscode"], activate: true });
    const saveTemplateUseCase = { execute: vi.fn(async () => undefined) };
    const writeAuditLogUseCase = { execute: vi.fn(async () => undefined) };
    createAdminStarterDeckContextMock.mockResolvedValueOnce({
      profile: { userId: "admin-1" },
      response: NextResponse.json({ ok: true }),
      saveTemplateUseCase,
      writeAuditLogUseCase,
    });
    consumeAdminMutationRateLimitMock.mockResolvedValueOnce(true);
    const request = new NextRequest("http://localhost:3000/api/admin/starter-deck/template", { method: "POST" });
    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(saveTemplateUseCase.execute).toHaveBeenCalledTimes(1);
    expect(writeAuditLogUseCase.execute).toHaveBeenCalledTimes(1);
  });

  it("GET responde 403 para sesión no admin", async () => {
    createAdminStarterDeckContextMock.mockRejectedValueOnce(new AuthorizationError("No autorizado"));
    const request = new NextRequest("http://localhost:3000/api/admin/starter-deck/template", { method: "GET" });
    const response = await GET(request);
    expect(response.status).toBe(403);
  });

  it("POST responde 403 para sesión no admin", async () => {
    requireTrustedMutationOriginMock.mockReturnValueOnce(null);
    createAdminStarterDeckContextMock.mockRejectedValueOnce(new AuthorizationError("No autorizado"));
    const request = new NextRequest("http://localhost:3000/api/admin/starter-deck/template", { method: "POST" });
    const response = await POST(request);
    expect(response.status).toBe(403);
  });
});
