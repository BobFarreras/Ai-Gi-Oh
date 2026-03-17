// src/services/security/api/validate-request-origin.test.ts - Verifica la política de origen confiable para endpoints mutables.
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { hasTrustedRequestOrigin } from "@/services/security/api/validate-request-origin";

function createRequest(origin: string | null, host = "localhost:3000"): NextRequest {
  const headers = new Headers();
  headers.set("host", host);
  if (origin) headers.set("origin", origin);
  return new NextRequest("http://localhost:3000/api/test", { headers });
}

describe("hasTrustedRequestOrigin", () => {
  it("acepta cuando origin coincide con host", () => {
    expect(hasTrustedRequestOrigin(createRequest("http://localhost:3000"))).toBe(true);
  });

  it("rechaza cuando origin no coincide con host", () => {
    expect(hasTrustedRequestOrigin(createRequest("https://evil.example"))).toBe(false);
  });

  it("acepta cuando no hay origin", () => {
    expect(hasTrustedRequestOrigin(createRequest(null))).toBe(true);
  });
});
