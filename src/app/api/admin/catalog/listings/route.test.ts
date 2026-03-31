// src/app/api/admin/catalog/listings/route.test.ts - Cubre seguridad y persistencia auditada para mutaciones de listings admin.
import { describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { AuthorizationError } from "@/core/errors/AuthorizationError";
import { POST } from "@/app/api/admin/catalog/listings/route";

const requireTrustedMutationOriginMock = vi.fn();
const createAdminCatalogContextMock = vi.fn();
const readAdminListingCommandMock = vi.fn();
const consumeAdminMutationRateLimitMock = vi.fn();
const createApiErrorResponseMock = vi.fn();

vi.mock("@/services/security/api/require-trusted-mutation-origin", () => ({
  requireTrustedMutationOrigin: (...args: unknown[]) => requireTrustedMutationOriginMock(...args),
}));
vi.mock("@/services/admin/api/create-admin-catalog-context", () => ({
  createAdminCatalogContext: (...args: unknown[]) => createAdminCatalogContextMock(...args),
}));
vi.mock("@/services/admin/api/read-admin-catalog-command", () => ({
  readAdminListingCommand: (...args: unknown[]) => readAdminListingCommandMock(...args),
}));
vi.mock("@/services/admin/api/security/admin-rate-limiter", () => ({
  consumeAdminMutationRateLimit: (...args: unknown[]) => consumeAdminMutationRateLimitMock(...args),
}));
vi.mock("@/services/security/api/create-api-error-response", () => ({
  createApiErrorResponse: (...args: unknown[]) => createApiErrorResponseMock(...args),
}));

function createRequest(): NextRequest {
  return new NextRequest("http://localhost:3000/api/admin/catalog/listings", { method: "POST" });
}

describe("POST /api/admin/catalog/listings", () => {
  it("responde 429 cuando el limitador deniega la mutación", async () => {
    requireTrustedMutationOriginMock.mockReturnValueOnce(null);
    createAdminCatalogContextMock.mockResolvedValueOnce({ profile: { userId: "admin-1" }, response: NextResponse.json({ ok: true }) });
    consumeAdminMutationRateLimitMock.mockResolvedValueOnce(false);
    const response = await POST(createRequest());
    expect(response.status).toBe(429);
  });

  it("actualiza listing y registra auditoría en éxito", async () => {
    requireTrustedMutationOriginMock.mockReturnValueOnce(null);
    readAdminListingCommandMock.mockResolvedValueOnce({ id: "listing-vscode", cardId: "entity-vscode", isAvailable: true, stock: 10 });
    const upsertListingUseCase = { execute: vi.fn(async () => undefined) };
    const writeAuditLogUseCase = { execute: vi.fn(async () => undefined) };
    createAdminCatalogContextMock.mockResolvedValueOnce({
      profile: { userId: "admin-1" },
      response: NextResponse.json({ ok: true }),
      upsertListingUseCase,
      writeAuditLogUseCase,
    });
    consumeAdminMutationRateLimitMock.mockResolvedValueOnce(true);
    const response = await POST(createRequest());
    expect(response.status).toBe(200);
    expect(upsertListingUseCase.execute).toHaveBeenCalledTimes(1);
    expect(writeAuditLogUseCase.execute).toHaveBeenCalledTimes(1);
  });

  it("responde 403 cuando la sesión no pertenece a admin", async () => {
    requireTrustedMutationOriginMock.mockReturnValueOnce(null);
    createAdminCatalogContextMock.mockRejectedValueOnce(new AuthorizationError("Sin permisos"));
    createApiErrorResponseMock.mockReturnValueOnce(NextResponse.json({ code: "AUTHORIZATION_ERROR" }, { status: 403 }));
    const response = await POST(createRequest());
    expect(response.status).toBe(403);
  });
});
