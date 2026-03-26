// src/app/api/admin/catalog/cards/route.test.ts - Verifica guardas de seguridad y flujo de guardado para cartas del catálogo admin.
import { describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { AuthorizationError } from "@/core/errors/AuthorizationError";
import { POST } from "@/app/api/admin/catalog/cards/route";

const requireTrustedMutationOriginMock = vi.fn();
const createAdminCatalogContextMock = vi.fn();
const readAdminCardCommandMock = vi.fn();
const consumeAdminMutationRateLimitMock = vi.fn();
const createApiErrorResponseMock = vi.fn();

vi.mock("@/services/security/api/require-trusted-mutation-origin", () => ({
  requireTrustedMutationOrigin: (...args: unknown[]) => requireTrustedMutationOriginMock(...args),
}));
vi.mock("@/services/admin/api/create-admin-catalog-context", () => ({
  createAdminCatalogContext: (...args: unknown[]) => createAdminCatalogContextMock(...args),
}));
vi.mock("@/services/admin/api/read-admin-catalog-command", () => ({
  readAdminCardCommand: (...args: unknown[]) => readAdminCardCommandMock(...args),
}));
vi.mock("@/services/admin/api/security/admin-rate-limiter", () => ({
  consumeAdminMutationRateLimit: (...args: unknown[]) => consumeAdminMutationRateLimitMock(...args),
}));
vi.mock("@/services/security/api/create-api-error-response", () => ({
  createApiErrorResponse: (...args: unknown[]) => createApiErrorResponseMock(...args),
}));

function createRequest(): NextRequest {
  return new NextRequest("http://localhost:3000/api/admin/catalog/cards", { method: "POST" });
}

describe("POST /api/admin/catalog/cards", () => {
  it("responde 403 cuando origin guard bloquea la petición", async () => {
    requireTrustedMutationOriginMock.mockReturnValueOnce(NextResponse.json({ ok: false }, { status: 403 }));
    const response = await POST(createRequest());
    expect(response.status).toBe(403);
  });

  it("responde 429 cuando el rate limit admin supera el umbral", async () => {
    requireTrustedMutationOriginMock.mockReturnValueOnce(null);
    createAdminCatalogContextMock.mockResolvedValueOnce({
      profile: { userId: "admin-1" },
      response: NextResponse.json({ ok: true }),
    });
    consumeAdminMutationRateLimitMock.mockResolvedValueOnce(false);
    const response = await POST(createRequest());
    expect(response.status).toBe(429);
  });

  it("guarda carta + escribe auditoría cuando la mutación es válida", async () => {
    requireTrustedMutationOriginMock.mockReturnValueOnce(null);
    readAdminCardCommandMock.mockResolvedValueOnce({ id: "entity-vscode", type: "ENTITY", isActive: true });
    const upsertCardUseCase = { execute: vi.fn(async () => undefined) };
    const writeAuditLogUseCase = { execute: vi.fn(async () => undefined) };
    createAdminCatalogContextMock.mockResolvedValueOnce({
      profile: { userId: "admin-1" },
      response: NextResponse.json({ ok: true }),
      upsertCardUseCase,
      writeAuditLogUseCase,
    });
    consumeAdminMutationRateLimitMock.mockResolvedValueOnce(true);

    const response = await POST(createRequest());
    expect(response.status).toBe(200);
    expect(upsertCardUseCase.execute).toHaveBeenCalledTimes(1);
    expect(writeAuditLogUseCase.execute).toHaveBeenCalledTimes(1);
  });

  it("delegada errores al formateador API", async () => {
    requireTrustedMutationOriginMock.mockReturnValueOnce(null);
    createAdminCatalogContextMock.mockRejectedValueOnce(new Error("boom"));
    createApiErrorResponseMock.mockReturnValueOnce(NextResponse.json({ code: "INTERNAL_ERROR" }, { status: 500 }));
    const response = await POST(createRequest());
    expect(response.status).toBe(500);
  });

  it("responde 403 cuando el usuario autenticado no tiene rol admin", async () => {
    requireTrustedMutationOriginMock.mockReturnValueOnce(null);
    createAdminCatalogContextMock.mockRejectedValueOnce(new AuthorizationError("No autorizado"));
    createApiErrorResponseMock.mockReturnValueOnce(NextResponse.json({ code: "AUTHORIZATION_ERROR" }, { status: 403 }));
    const response = await POST(createRequest());
    expect(response.status).toBe(403);
  });
});
