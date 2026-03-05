// src/app/api/auth/login/route.test.ts - Pruebas del endpoint de login con validaciones de seguridad y límites de abuso.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { resetAuthRateLimiterForTests } from "@/services/auth/api/security/auth-rate-limiter";
import { POST } from "@/app/api/auth/login/route";

const signInWithPasswordMock = vi.fn();

vi.mock("@/infrastructure/persistence/supabase/internal/create-supabase-route-client", () => ({
  createSupabaseRouteClient: () => ({
    auth: {
      signInWithPassword: signInWithPasswordMock,
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
    },
  }),
}));

function createRequest(origin: string, email = "player@aigi.io"): NextRequest {
  return new NextRequest("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin,
      host: "localhost:3000",
      "x-forwarded-for": "10.1.1.2",
    },
    body: JSON.stringify({ email, password: "12345678" }),
  });
}

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    resetAuthRateLimiterForTests();
    signInWithPasswordMock.mockReset();
  });

  it("responde 200 cuando credenciales son válidas", async () => {
    signInWithPasswordMock.mockResolvedValueOnce({
      data: {
        session: {
          access_token: "token",
          expires_at: 1999999999,
          user: { id: "user-1", email: "player@aigi.io", user_metadata: {} },
        },
      },
      error: null,
    });
    const response = await POST(createRequest("http://localhost:3000"));
    expect(response.status).toBe(200);
  });

  it("bloquea petición con origin no confiable", async () => {
    const response = await POST(createRequest("https://evil.example"));
    expect(response.status).toBe(403);
  });

  it("aplica rate limit por IP/email", async () => {
    signInWithPasswordMock.mockResolvedValue({
      data: { session: null },
      error: { message: "invalid" },
    });
    let lastStatus = 0;
    for (let attempt = 0; attempt < 11; attempt += 1) {
      const response = await POST(createRequest("http://localhost:3000"));
      lastStatus = response.status;
    }
    expect(lastStatus).toBe(429);
  });
});
