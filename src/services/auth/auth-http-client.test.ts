// src/services/auth/auth-http-client.test.ts - Valida resolución de sesión admin desde cliente HTTP de autenticación.
import { afterEach, describe, expect, it, vi } from "vitest";
import { hasCurrentAdminSession, loginWithEmail, requestPasswordRecovery, updateCurrentPassword } from "@/services/auth/auth-http-client";

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

describe("auth-http-client login robustez de errores", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("usa el mensaje del servidor en credenciales inválidas (401 JSON)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ ok: false, message: "Credenciales incorrectas." }, { status: 401 })));
    await expect(loginWithEmail({ email: "x@y.io", password: "bad" })).resolves.toEqual({ ok: false, message: "Credenciales incorrectas." });
  });

  it("no lanza si el servidor devuelve un 500 con texto plano (no JSON)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("Internal Server Error", { status: 500 })));
    const result = await loginWithEmail({ email: "x@y.io", password: "bad" });
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/servidor/i);
  });

  it("devuelve un mensaje claro ante fallo de red", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("network"))));
    const result = await loginWithEmail({ email: "x@y.io", password: "bad" });
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/conectar|conexión/i);
  });
});
