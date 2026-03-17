// src/services/security/api/create-api-error-response.test.ts - Verifica mapeo de errores a status HTTP y contrato de respuesta con traceId.
import { describe, expect, it } from "vitest";
import { ValidationError } from "@/core/errors/ValidationError";
import { NotFoundError } from "@/core/errors/NotFoundError";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";

describe("createApiErrorResponse", () => {
  it("mapea ValidationError a 400 con código de dominio", async () => {
    const response = createApiErrorResponse(new ValidationError("Payload inválido"), "fallback");
    expect(response.status).toBe(400);
    const body = (await response.json()) as { code: string; message: string; traceId: string };
    expect(body.code).toBe("VALIDATION_ERROR");
    expect(body.message).toBe("Payload inválido");
    expect(body.traceId.length).toBeGreaterThan(0);
  });

  it("mapea NotFoundError a 404", async () => {
    const response = createApiErrorResponse(new NotFoundError("No existe"), "fallback");
    expect(response.status).toBe(404);
  });

  it("mapea error inesperado a 500 con código INTERNAL_ERROR", async () => {
    const response = createApiErrorResponse(new Error("boom"), "Error interno");
    expect(response.status).toBe(500);
    const body = (await response.json()) as { code: string; message: string; traceId: string };
    expect(body.code).toBe("INTERNAL_ERROR");
    expect(body.message).toBe("Error interno");
  });
});
