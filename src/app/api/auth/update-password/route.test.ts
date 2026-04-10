// src/app/api/auth/update-password/route.test.ts - Pruebas del endpoint para actualizar contraseña en flujo de recuperación.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { resetAuthRateLimiterForTests } from "@/services/auth/api/security/auth-rate-limiter";
import { POST } from "@/app/api/auth/update-password/route";

const updateUserMock = vi.fn();

vi.mock("@/infrastructure/persistence/supabase/internal/create-supabase-route-client", () => ({
  createSupabaseRouteClient: () => ({
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      updateUser: updateUserMock,
      resetPasswordForEmail: vi.fn(),
    },
  }),
}));

function createRequest(origin: string, password = "12345678"): NextRequest {
  return new NextRequest("http://localhost:3000/api/auth/update-password", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin,
      host: "localhost:3000",
      "x-forwarded-for": "10.8.8.8",
    },
    body: JSON.stringify({ password }),
  });
}

describe("POST /api/auth/update-password", () => {
  beforeEach(() => {
    resetAuthRateLimiterForTests();
    updateUserMock.mockReset();
  });

  it("responde 200 cuando la contraseña nueva es válida", async () => {
    updateUserMock.mockResolvedValueOnce({ data: { user: { id: "user-1" } }, error: null });
    const response = await POST(createRequest("http://localhost:3000"));
    expect(response.status).toBe(200);
  });

  it("devuelve 400 cuando la contraseña es corta", async () => {
    const response = await POST(createRequest("http://localhost:3000", "1234"));
    expect(response.status).toBe(400);
  });

  it("bloquea origin no confiable", async () => {
    const response = await POST(createRequest("https://evil.example"));
    expect(response.status).toBe(403);
  });
});
