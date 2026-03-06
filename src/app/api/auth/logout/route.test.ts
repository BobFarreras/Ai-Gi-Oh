// src/app/api/auth/logout/route.test.ts - Pruebas del endpoint de logout y sus controles de seguridad.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { resetAuthRateLimiterForTests } from "@/services/auth/api/security/auth-rate-limiter";
import { POST } from "@/app/api/auth/logout/route";

const signOutMock = vi.fn();

vi.mock("@/infrastructure/persistence/supabase/internal/create-supabase-route-client", () => ({
  createSupabaseRouteClient: () => ({
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: signOutMock,
      getSession: vi.fn(),
    },
  }),
}));

function createRequest(origin: string): NextRequest {
  return new NextRequest("http://localhost:3000/api/auth/logout", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin,
      host: "localhost:3000",
      "x-forwarded-for": "10.5.6.7",
    },
  });
}

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    resetAuthRateLimiterForTests();
    signOutMock.mockReset();
  });

  it("responde 200 cuando el cierre de sesión es correcto", async () => {
    signOutMock.mockResolvedValueOnce({ error: null });
    const response = await POST(createRequest("http://localhost:3000"));
    expect(response.status).toBe(200);
  });

  it("bloquea origin no confiable", async () => {
    const response = await POST(createRequest("https://evil.example"));
    expect(response.status).toBe(403);
  });
});
