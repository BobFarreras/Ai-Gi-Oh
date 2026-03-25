// src/app/api/admin/session/route.test.ts - Verifica contrato del endpoint admin de sesión para éxito y errores de autorización.
import { describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { GET } from "@/app/api/admin/session/route";

const createAdminRouteContextMock = vi.fn();
const createApiErrorResponseMock = vi.fn();

vi.mock("@/services/admin/api/create-admin-route-context", () => ({
  createAdminRouteContext: (...args: unknown[]) => createAdminRouteContextMock(...args),
}));

vi.mock("@/services/security/api/create-api-error-response", () => ({
  createApiErrorResponse: (...args: unknown[]) => createApiErrorResponseMock(...args),
}));

describe("GET /api/admin/session", () => {
  it("responde 200 con userId y role cuando el usuario es admin", async () => {
    createAdminRouteContextMock.mockResolvedValueOnce({
      response: NextResponse.json({ ok: true }, { status: 200 }),
      profile: { userId: "admin-1", role: "SUPER_ADMIN" },
    });
    const request = new NextRequest("http://localhost:3000/api/admin/session", { method: "GET" });
    const response = await GET(request);
    expect(response.status).toBe(200);
    const body = (await response.json()) as { ok: boolean; userId: string; role: string };
    expect(body.ok).toBe(true);
    expect(body.userId).toBe("admin-1");
    expect(body.role).toBe("SUPER_ADMIN");
  });

  it("delegada error tipado al mapeador de errores API", async () => {
    createAdminRouteContextMock.mockRejectedValueOnce(new Error("denied"));
    createApiErrorResponseMock.mockReturnValueOnce(
      NextResponse.json({ code: "AUTHORIZATION_ERROR", message: "No autorizado", traceId: "trace-1" }, { status: 403 }),
    );
    const request = new NextRequest("http://localhost:3000/api/admin/session", { method: "GET" });
    const response = await GET(request);
    expect(response.status).toBe(403);
    expect(createApiErrorResponseMock).toHaveBeenCalledTimes(1);
  });
});
