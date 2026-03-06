// src/services/auth/api/internal/read-auth-credentials.ts - Parser tipado y seguro de credenciales de autenticación para requests JSON.
import { NextRequest } from "next/server";
import { ValidationError } from "@/core/errors/ValidationError";

export interface IAuthCredentialsInput {
  email: string;
  password: string;
}

export async function readAuthCredentials(request: NextRequest): Promise<IAuthCredentialsInput> {
  const payload = (await request.json()) as unknown;
  if (typeof payload !== "object" || payload === null) {
    throw new ValidationError("Payload inválido para autenticación.");
  }
  const email = "email" in payload ? payload.email : undefined;
  const password = "password" in payload ? payload.password : undefined;
  if (typeof email !== "string" || typeof password !== "string") {
    throw new ValidationError("Email y contraseña son obligatorios.");
  }
  return { email, password };
}
