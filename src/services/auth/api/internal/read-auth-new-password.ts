// src/services/auth/api/internal/read-auth-new-password.ts - Parser seguro de nueva contraseña para flujo de reset autenticado.
import { NextRequest } from "next/server";
import { ValidationError } from "@/core/errors/ValidationError";

interface IAuthPasswordPayload {
  password: string;
}

/**
 * Lee la nueva contraseña de la request validando forma de payload antes de la capa de aplicación.
 */
export async function readAuthNewPassword(request: NextRequest): Promise<string> {
  const payload = (await request.json()) as unknown;
  if (typeof payload !== "object" || payload === null) {
    throw new ValidationError("Payload inválido para actualización de contraseña.");
  }
  const password = "password" in payload ? (payload as IAuthPasswordPayload).password : undefined;
  if (typeof password !== "string") {
    throw new ValidationError("La contraseña es obligatoria.");
  }
  return password;
}
