// src/services/auth/auth-http-client.test.ts - Valida resolución de sesión admin desde cliente HTTP de autenticación.
import { afterEach, describe, expect, it, vi } from "vitest";
import { hasCurrentAdminSession, requestPasswordRecovery, updateCurrentPassword } from "@/services/auth/auth-http-client";

describe("hasCurrentAdminSession", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("devuelve true cuando /api/admin/session responde ok", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 200 })));
    await expect(hasCurrentAdminSession()).resolves.toBe(true);
  });

  it("devuelve false cuando /api/admin/session responde error o lanza excepción", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 403 })));
    await expect(hasCurrentAdminSession()).resolves.toBe(false);
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("network"))));
    await expect(hasCurrentAdminSession()).resolves.toBe(false);
  });
});

describe("auth-http-client recovery flows", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requestPasswordRecovery devuelve resultado de éxito", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ ok: true, message: null }, { status: 200 })));
    await expect(requestPasswordRecovery("test@aigi.io")).resolves.toEqual({ ok: true, message: null });
  });

  it("updateCurrentPassword devuelve error cuando la API falla", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ ok: false, message: "Error" }, { status: 400 })));
    await expect(updateCurrentPassword("12345678")).resolves.toEqual({ ok: false, message: "Error" });
  });
});
