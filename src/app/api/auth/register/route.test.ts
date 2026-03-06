// src/app/api/auth/register/route.test.ts - Pruebas del endpoint de registro con validación y seguridad anti abuso.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { resetAuthRateLimiterForTests } from "@/services/auth/api/security/auth-rate-limiter";
import { POST } from "@/app/api/auth/register/route";

const signUpMock = vi.fn();

vi.mock("@/infrastructure/persistence/supabase/internal/create-supabase-route-client", () => ({
  createSupabaseRouteClient: () => ({
    auth: {
      signInWithPassword: vi.fn(),
      signUp: signUpMock,
      signOut: vi.fn(),
      getSession: vi.fn(),
    },
  }),
}));

function createRequest(origin: string, password = "12345678"): NextRequest {
  return new NextRequest("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin,
      host: "localhost:3000",
      "x-forwarded-for": "10.2.3.4",
    },
    body: JSON.stringify({ email: "new@aigi.io", password }),
  });
}

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    resetAuthRateLimiterForTests();
    signUpMock.mockReset();
  });

  it("responde 200 cuando registro es válido", async () => {
    signUpMock.mockResolvedValueOnce({
      data: {
        session: {
          access_token: "token",
          expires_at: 1999999999,
          user: { id: "user-2", email: "new@aigi.io", user_metadata: {} },
        },
      },
      error: null,
    });
    const response = await POST(createRequest("http://localhost:3000"));
    expect(response.status).toBe(200);
  });

  it("devuelve 400 si la contraseña no cumple mínimo", async () => {
    const response = await POST(createRequest("http://localhost:3000", "1234"));
    expect(response.status).toBe(400);
  });

  it("bloquea exceso de intentos", async () => {
    signUpMock.mockResolvedValue({
      data: { session: null },
      error: { message: "invalid" },
    });
    let lastStatus = 0;
    for (let attempt = 0; attempt < 7; attempt += 1) {
      const response = await POST(createRequest("http://localhost:3000"));
      lastStatus = response.status;
    }
    expect(lastStatus).toBe(429);
  });
});
