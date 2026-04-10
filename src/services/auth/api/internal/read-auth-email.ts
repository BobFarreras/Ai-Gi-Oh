// src/services/auth/api/internal/read-auth-email.ts - Parser seguro del email para operaciones que no requieren contraseña.
import { NextRequest } from "next/server";
import { ValidationError } from "@/core/errors/ValidationError";

interface IAuthEmailPayload {
  email: string;
}

/**
 * Extrae email desde payload JSON para flujos de recuperación sin exponer castings inseguros.
 */
export async function readAuthEmail(request: NextRequest): Promise<string> {
  const payload = (await request.json()) as unknown;
  if (typeof payload !== "object" || payload === null) {
    throw new ValidationError("Payload inválido para recuperación.");
  }
  const email = "email" in payload ? (payload as IAuthEmailPayload).email : undefined;
  if (typeof email !== "string") {
    throw new ValidationError("El email es obligatorio.");
  }
  return email;
}
