// src/app/api/auth/recover/route.test.ts - Pruebas del endpoint de recuperación de contraseña con controles de seguridad.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { resetAuthRateLimiterForTests } from "@/services/auth/api/security/auth-rate-limiter";
import { POST } from "@/app/api/auth/recover/route";

const resetPasswordForEmailMock = vi.fn();

vi.mock("@/infrastructure/persistence/supabase/internal/create-supabase-route-client", () => ({
  createSupabaseRouteClient: () => ({
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      updateUser: vi.fn(),
      resetPasswordForEmail: resetPasswordForEmailMock,
    },
  }),
}));

function createRequest(origin: string, email = "player@aigi.io"): NextRequest {
  return new NextRequest("http://localhost:3000/api/auth/recover", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin,
      host: "localhost:3000",
      "x-forwarded-for": "10.7.7.7",
    },
    body: JSON.stringify({ email }),
  });
}

describe("POST /api/auth/recover", () => {
  beforeEach(() => {
    resetAuthRateLimiterForTests();
    resetPasswordForEmailMock.mockReset();
  });

  it("responde 200 cuando la solicitud de recuperación es válida", async () => {
    resetPasswordForEmailMock.mockResolvedValueOnce({ data: {}, error: null });
    const response = await POST(createRequest("http://localhost:3000"));
    expect(response.status).toBe(200);
  });

  it("bloquea origin no confiable", async () => {
    const response = await POST(createRequest("https://evil.example"));
    expect(response.status).toBe(403);
  });

  it("aplica rate limit por IP/email", async () => {
    resetPasswordForEmailMock.mockResolvedValue({ data: {}, error: null });
    let lastStatus = 0;
    for (let attempt = 0; attempt < 7; attempt += 1) {
      const response = await POST(createRequest("http://localhost:3000"));
      lastStatus = response.status;
    }
    expect(lastStatus).toBe(429);
  });
});
