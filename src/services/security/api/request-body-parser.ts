// src/services/security/api/request-body-parser.ts - Utilidades comunes para parsear y validar payloads JSON en route handlers.
import { NextRequest } from "next/server";
import { ValidationError } from "@/core/errors/ValidationError";

export type JsonObject = Record<string, unknown>;

/**
 * Lee el body JSON y garantiza que la raíz sea un objeto plano.
 */
export async function readJsonObjectBody(request: NextRequest, invalidPayloadMessage: string): Promise<JsonObject> {
  const payload = (await request.json()) as unknown;
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    throw new ValidationError(invalidPayloadMessage);
  }
  return payload as JsonObject;
}

/**
 * Obtiene un campo string obligatorio y no vacío.
 */
export function readRequiredStringField(payload: JsonObject, field: string, message: string): string {
  const value = payload[field];
  if (typeof value !== "string" || !value.trim()) {
    throw new ValidationError(message);
  }
  return value.trim();
}

/**
 * Obtiene un campo numérico obligatorio y entero.
 */
export function readRequiredIntegerField(payload: JsonObject, field: string, message: string): number {
  const value = payload[field];
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new ValidationError(message);
  }
  return value;
}

/**
 * Obtiene un campo array obligatorio.
 */
export function readRequiredArrayField<T>(payload: JsonObject, field: string, message: string): T[] {
  const value = payload[field];
  if (!Array.isArray(value)) {
    throw new ValidationError(message);
  }
  return value as T[];
}
