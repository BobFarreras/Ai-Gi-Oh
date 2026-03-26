// src/app/api/admin/audit/route.test.ts - Valida contrato de lectura paginada de auditoría admin y manejo de errores de acceso.
import { describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { GET } from "@/app/api/admin/audit/route";

const createAdminRouteContextMock = vi.fn();
const createSupabaseServiceRoleClientMock = vi.fn();
const readAdminAuditPageQueryMock = vi.fn();
const listPageMock = vi.fn();
const createApiErrorResponseMock = vi.fn();

vi.mock("@/services/admin/api/create-admin-route-context", () => ({
  createAdminRouteContext: (...args: unknown[]) => createAdminRouteContextMock(...args),
}));
vi.mock("@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client", () => ({
  createSupabaseServiceRoleClient: (...args: unknown[]) => createSupabaseServiceRoleClientMock(...args),
}));
vi.mock("@/services/admin/internal/read-admin-audit-query", () => ({
  readAdminAuditPageQuery: (...args: unknown[]) => readAdminAuditPageQueryMock(...args),
}));
vi.mock("@/infrastructure/persistence/supabase/admin/SupabaseAdminAuditLogRepository", () => ({
  SupabaseAdminAuditLogRepository: class {
    async listPage(...args: unknown[]) {
      return listPageMock(...args);
    }
  },
}));
vi.mock("@/services/security/api/create-api-error-response", () => ({
  createApiErrorResponse: (...args: unknown[]) => createApiErrorResponseMock(...args),
}));

describe("GET /api/admin/audit", () => {
  it("responde página de auditoría cuando el contexto admin es válido", async () => {
    createAdminRouteContextMock.mockResolvedValueOnce({ response: NextResponse.json({ ok: true }) });
    createSupabaseServiceRoleClientMock.mockReturnValueOnce({});
    readAdminAuditPageQueryMock.mockReturnValueOnce({ page: 1, pageSize: 20 });
    listPageMock.mockResolvedValueOnce({ items: [], page: 1, pageSize: 20, total: 0 });
    const response = await GET(new NextRequest("http://localhost:3000/api/admin/audit?page=1"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ items: [], page: 1, pageSize: 20, total: 0 });
  });

  it("devuelve error 403 cuando no hay permisos admin", async () => {
    createAdminRouteContextMock.mockRejectedValueOnce(new Error("forbidden"));
    createApiErrorResponseMock.mockReturnValueOnce(NextResponse.json({ code: "AUTHORIZATION_ERROR" }, { status: 403 }));
    const response = await GET(new NextRequest("http://localhost:3000/api/admin/audit"));
    expect(response.status).toBe(403);
  });
});
