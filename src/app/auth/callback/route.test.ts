// src/app/auth/callback/route.test.ts - Pruebas de callback auth para intercambio de código y redirección segura.
import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/auth/callback/route";

const exchangeCodeForSessionMock = vi.fn();

vi.mock("@/infrastructure/persistence/supabase/internal/create-supabase-route-client", () => ({
  createSupabaseRouteClient: () => ({
    auth: {
      exchangeCodeForSession: exchangeCodeForSessionMock,
    },
  }),
}));

describe("GET /auth/callback", () => {
  it("redirige a /reset-password cuando intercambio es correcto", async () => {
    exchangeCodeForSessionMock.mockResolvedValueOnce({ data: { session: { access_token: "token" } }, error: null });
    const request = new NextRequest("http://localhost:3000/auth/callback?code=abc123&next=/reset-password");
    const response = await GET(request);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/reset-password");
  });

  it("redirige a login cuando falta el código", async () => {
    const request = new NextRequest("http://localhost:3000/auth/callback?next=/reset-password");
    const response = await GET(request);
    expect(response.headers.get("location")).toContain("/login?error=missing_auth_code");
  });
});
