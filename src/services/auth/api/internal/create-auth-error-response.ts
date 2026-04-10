// src/services/auth/api/internal/create-auth-error-response.ts - Traduce errores de autenticación a respuestas HTTP seguras para cliente.
import { NextResponse } from "next/server";
import { ValidationError } from "@/core/errors/ValidationError";

type AuthAction = "LOGIN" | "REGISTER" | "LOGOUT" | "RECOVER_PASSWORD" | "UPDATE_PASSWORD";

function defaultMessage(action: AuthAction): string {
  if (action === "LOGIN") return "No se pudo iniciar sesión.";
  if (action === "REGISTER") return "No se pudo registrar la cuenta.";
  if (action === "LOGOUT") return "No se pudo cerrar sesión.";
  if (action === "RECOVER_PASSWORD") return "No se pudo iniciar la recuperación de contraseña.";
  return "No se pudo actualizar la contraseña.";
}

export function createAuthErrorResponse(action: AuthAction, error: unknown): NextResponse {
  if (error instanceof ValidationError) {
    const status = action === "LOGIN" ? 401 : 400;
    return NextResponse.json({ ok: false, message: error.message }, { status });
  }
  return NextResponse.json({ ok: false, message: defaultMessage(action) }, { status: 400 });
}
