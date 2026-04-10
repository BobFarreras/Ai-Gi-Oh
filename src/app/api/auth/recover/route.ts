// src/app/api/auth/recover/route.ts - Endpoint HTTP para iniciar recuperación de contraseña con email.
import { NextRequest } from "next/server";
import { handleRecoverPasswordRequest } from "@/services/auth/api/handle-recover-password-request";

export async function POST(request: NextRequest) {
  return handleRecoverPasswordRequest(request);
}
