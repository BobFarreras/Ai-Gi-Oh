// src/services/security/api/create-api-error-response.ts - Mapea errores de dominio a respuestas HTTP homogéneas con traceId para observabilidad.
import { NextResponse } from "next/server";
import { isAppError } from "@/core/errors/isAppError";

interface IApiErrorBody {
  code: string;
  message: string;
  traceId: string;
}

function resolveTraceId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `trace-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
}

function mapAppErrorToStatus(code: string): number {
  if (code === "NOT_FOUND_ERROR") return 404;
  if (code === "VALIDATION_ERROR" || code === "GAME_RULE_ERROR") return 400;
  return 400;
}

/**
 * Genera respuesta de error API uniforme para facilitar depuración y monitoreo.
 */
export function createApiErrorResponse(error: unknown, fallbackMessage: string): NextResponse<IApiErrorBody> {
  const traceId = resolveTraceId();
  if (isAppError(error)) {
    return NextResponse.json(
      {
        code: error.code,
        message: error.message,
        traceId,
      },
      { status: mapAppErrorToStatus(error.code) },
    );
  }
  return NextResponse.json(
    {
      code: "INTERNAL_ERROR",
      message: fallbackMessage,
      traceId,
    },
    { status: 500 },
  );
}
